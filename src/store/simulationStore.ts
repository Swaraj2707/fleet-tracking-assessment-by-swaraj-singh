import { create } from "zustand";
import type {
  EventStatus,
  FleetDataset,
  FleetEvent,
  FleetEventBase,
  FleetMetrics,
  TripRuntimeState,
  TripStatus,
  TripSummary,
} from "../types";

interface TripRuntimeInternal extends TripRuntimeState {
  totalSpeed: number;
  speedSamples: number;
}

interface SimulationStore {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  events: FleetEvent[];
  trips: TripSummary[];
  tripStates: Record<string, TripRuntimeInternal>;
  startTimeMs: number;
  endTimeMs: number;
  simulationTimeMs: number;
  nextEventIndex: number;
  playing: boolean;
  speedMultiplier: number;
  recentEvents: FleetEvent[];
  fleetMetrics: FleetMetrics;
  loadData: () => Promise<void>;
  setPlaying: (playing: boolean) => void;
  setSpeedMultiplier: (speed: number) => void;
  stepTo: (targetTimeMs: number) => void;
  reset: () => void;
}

const DEFAULT_FLEET_METRICS: FleetMetrics = {
  activeTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  delayedTrips: 0,
  averageFleetSpeed: 0,
  criticalAlerts: 0,
  warningAlerts: 0,
};

const createInitialTripState = (trip: TripSummary): TripRuntimeInternal => ({
  trip,
  status: "scheduled",
  lastEvent: undefined,
  eventsProcessed: 0,
  progressPct: 0,
  distanceTravelledKm: 0,
  avgSpeedKph: 0,
  currentSpeedKph: 0,
  fuelLevelPct: 100,
  batteryLevelPct: undefined,
  activeAlerts: [],
  totalSpeed: 0,
  speedSamples: 0,
});

const enrichEvent = (event: FleetEventBase): FleetEvent => ({
  ...event,
  timestampMs: new Date(event.timestamp).getTime(),
});

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const computeFleetMetrics = (states: Record<string, TripRuntimeInternal>): FleetMetrics => {
  const metrics: FleetMetrics = { ...DEFAULT_FLEET_METRICS };
  let speedAccumulator = 0;
  let speedSamples = 0;

  Object.values(states).forEach((state) => {
    switch (state.status) {
      case "en_route":
        metrics.activeTrips += 1;
        break;
      case "completed":
        metrics.completedTrips += 1;
        break;
      case "cancelled":
        metrics.cancelledTrips += 1;
        break;
      case "delayed":
        metrics.delayedTrips += 1;
        break;
      default:
        break;
    }

    if (state.speedSamples > 0) {
      speedAccumulator += state.totalSpeed;
      speedSamples += state.speedSamples;
    }

    state.activeAlerts.forEach((event) => {
      if (event.status === "critical") {
        metrics.criticalAlerts += 1;
      } else if (event.status === "warning") {
        metrics.warningAlerts += 1;
      }
    });
  });

  metrics.averageFleetSpeed =
    speedSamples > 0 ? parseFloat((speedAccumulator / speedSamples).toFixed(1)) : 0;

  return metrics;
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  status: "idle",
  events: [],
  trips: [],
  tripStates: {},
  startTimeMs: 0,
  endTimeMs: 0,
  simulationTimeMs: 0,
  nextEventIndex: 0,
  playing: false,
  speedMultiplier: 60,
  recentEvents: [],
  fleetMetrics: DEFAULT_FLEET_METRICS,

  async loadData() {
    if (get().status === "loading" || get().status === "ready") return;

    set({ status: "loading", error: undefined });
    try {
      const response = await fetch("/data/fleet-events.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset (${response.status})`);
      }
      const dataset = (await response.json()) as FleetDataset;
      const trips = dataset.trips;
      const events = dataset.events.map(enrichEvent).sort((a, b) => a.timestampMs - b.timestampMs);
      const startTimeMs = events[0]?.timestampMs ?? 0;
      const endTimeMs = events[events.length - 1]?.timestampMs ?? startTimeMs;
      const tripStates = Object.fromEntries(
        trips.map((trip) => [trip.tripId, createInitialTripState(trip)])
      );

      set({
        status: "ready",
        events,
        trips,
        tripStates,
        startTimeMs,
        endTimeMs,
        simulationTimeMs: startTimeMs,
        nextEventIndex: 0,
        recentEvents: [],
        fleetMetrics: DEFAULT_FLEET_METRICS,
        playing: true,
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  setPlaying(playing) {
    set({ playing });
  },

  setSpeedMultiplier(speedMultiplier) {
    set({ speedMultiplier });
  },

  reset() {
    const { trips, startTimeMs } = get();
    const tripStates = Object.fromEntries(
      trips.map((trip) => [trip.tripId, createInitialTripState(trip)])
    );
    set({
      tripStates,
      simulationTimeMs: startTimeMs,
      nextEventIndex: 0,
      recentEvents: [],
      playing: false,
      fleetMetrics: DEFAULT_FLEET_METRICS,
    });
  },

  stepTo(targetTimeMs) {
    const state = get();
    if (state.status !== "ready") return;

    const clampedTime = clamp(targetTimeMs, state.startTimeMs, state.endTimeMs);
    if (clampedTime < state.simulationTimeMs) {
      // Rewinding requires reset then fast-forward.
      state.reset();
      useSimulationStore.getState().stepTo(targetTimeMs);
      return;
    }

    const tripStates = { ...state.tripStates };
    const recentEvents = [...state.recentEvents];
    let nextEventIndex = state.nextEventIndex;

    while (
      nextEventIndex < state.events.length &&
      state.events[nextEventIndex].timestampMs <= clampedTime
    ) {
      const event = state.events[nextEventIndex];
      const runtime = { ...tripStates[event.tripId] };
      if (!runtime.trip) {
        runtime.trip =
          state.trips.find((trip) => trip.tripId === event.tripId) ??
          ({
            tripId: event.tripId,
            name: event.tripId,
            driver: "Unknown",
            vehicleId: "Unknown",
            carrier: "Unknown",
            scenario: "regional",
            startTime: event.timestamp,
            estimatedEndTime: event.timestamp,
            plannedStops: [],
            distanceKm: event.odometerKm,
          } as TripSummary);
        runtime.status = "scheduled";
        runtime.eventsProcessed = 0;
        runtime.progressPct = 0;
        runtime.distanceTravelledKm = 0;
        runtime.avgSpeedKph = 0;
        runtime.currentSpeedKph = 0;
        runtime.fuelLevelPct = 100;
        runtime.totalSpeed = 0;
        runtime.speedSamples = 0;
        runtime.activeAlerts = [];
      } else {
        runtime.activeAlerts = [...runtime.activeAlerts];
      }

      runtime.eventsProcessed += 1;
      runtime.lastEvent = event;
      runtime.currentSpeedKph = event.speedKph;
      runtime.fuelLevelPct = event.fuelLevelPct;
      if (event.batteryLevelPct !== undefined) {
        runtime.batteryLevelPct = event.batteryLevelPct;
      }

      runtime.distanceTravelledKm = clamp(
        event.odometerKm,
        0,
        runtime.trip.distanceKm
      );
      runtime.progressPct = parseFloat(
        clamp(
          (runtime.distanceTravelledKm / Math.max(runtime.trip.distanceKm, 1)) * 100,
          0,
          100
        ).toFixed(1)
      );

      runtime.totalSpeed += event.speedKph;
      runtime.speedSamples += 1;
      runtime.avgSpeedKph = parseFloat(
        (runtime.totalSpeed / runtime.speedSamples).toFixed(1)
      );

      if (event.status === "warning" || event.status === "critical") {
        runtime.activeAlerts.unshift(event);
        runtime.activeAlerts = runtime.activeAlerts.slice(0, 12);
      }

      runtime.status = deriveTripStatus(runtime.status, event.type, event.status);

      tripStates[event.tripId] = runtime;
      recentEvents.push(event);
      if (recentEvents.length > 60) {
        recentEvents.shift();
      }

      nextEventIndex += 1;
    }

    const fleetMetrics = computeFleetMetrics(tripStates);

    set({
      tripStates,
      simulationTimeMs: clampedTime,
      nextEventIndex,
      recentEvents,
      fleetMetrics,
    });
  },
}));

function deriveTripStatus(
  current: TripStatus,
  type: FleetEvent["type"],
  status: EventStatus
): TripStatus {
  if (type === "TRIP_STARTED") return "en_route";
  if (type === "TRIP_RESUMED") return "en_route";
  if (type === "TRIP_COMPLETED") return "completed";
  if (type === "TRIP_CANCELLED") return "cancelled";
  if (type === "TRIP_DELAYED" || status === "warning") {
    if (current === "completed" || current === "cancelled") return current;
    return type === "TRIP_DELAYED" ? "delayed" : current;
  }
  return current;
}

