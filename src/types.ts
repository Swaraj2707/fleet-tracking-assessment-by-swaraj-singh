export type EventStatus = "normal" | "warning" | "critical";

export type EventType =
  | "TRIP_STARTED"
  | "LOCATION_UPDATE"
  | "ENGINE_STATUS"
  | "FUEL_LEVEL"
  | "SPEEDING_ALERT"
  | "REST_STOP"
  | "HARSH_BRAKE"
  | "IDLE_ALERT"
  | "DEVICE_OFFLINE"
  | "GEOFENCE_ENTER"
  | "GEOFENCE_EXIT"
  | "ROAD_HAZARD"
  | "SERVICE_REMINDER"
  | "LOAD_TEMPERATURE"
  | "BATTERY_DROP"
  | "INCIDENT_REPORT"
  | "DRIVER_CHECKIN"
  | "DRIVER_CHECKOUT"
  | "TRIP_DELAYED"
  | "TRIP_RESUMED"
  | "TRIP_CANCELLED"
  | "TRIP_COMPLETED";

export interface TripSummary {
  tripId: string;
  name: string;
  driver: string;
  vehicleId: string;
  carrier: string;
  scenario: "long-haul" | "urban" | "mountain" | "technical" | "regional";
  startTime: string;
  estimatedEndTime: string;
  plannedStops: string[];
  distanceKm: number;
}

export interface FleetEventBase {
  id: string;
  tripId: string;
  type: EventType;
  status: EventStatus;
  timestamp: string;
  position: {
    lat: number;
    lng: number;
    cityHint: string;
  };
  speedKph: number;
  odometerKm: number;
  fuelLevelPct: number;
  batteryLevelPct?: number;
  headingDeg: number;
  meta: Record<string, unknown>;
}

export interface FleetEvent extends FleetEventBase {
  /**
   * Derived numeric timestamp to speed up processing.
   */
  timestampMs: number;
}

export interface FleetDataset {
  generatedAt: string;
  trips: TripSummary[];
  events: FleetEventBase[];
  metadata: {
    version: string;
    generator: string;
    notes: string[];
  };
}

export type TripStatus =
  | "scheduled"
  | "en_route"
  | "delayed"
  | "completed"
  | "cancelled";

export interface TripRuntimeState {
  trip: TripSummary;
  status: TripStatus;
  lastEvent?: FleetEvent;
  eventsProcessed: number;
  progressPct: number;
  distanceTravelledKm: number;
  avgSpeedKph: number;
  currentSpeedKph: number;
  fuelLevelPct: number;
  batteryLevelPct?: number;
  activeAlerts: FleetEvent[];
}

export interface FleetMetrics {
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  delayedTrips: number;
  averageFleetSpeed: number;
  criticalAlerts: number;
  warningAlerts: number;
}

