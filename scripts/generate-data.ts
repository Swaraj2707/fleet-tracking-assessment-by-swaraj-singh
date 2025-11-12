import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

type EventStatus = "normal" | "warning" | "critical";

type EventType =
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

interface TripPlan {
  id: string;
  name: string;
  scenario: "long-haul" | "urban" | "mountain" | "technical" | "regional";
  driver: string;
  coDriver?: string;
  vehicleId: string;
  carrier: string;
  route: Array<{
    label: string;
    lat: number;
    lng: number;
  }>;
  totalEvents: number;
  startTime: string;
  durationHours: number;
  seed?: number;
}

interface TripSummary {
  tripId: string;
  name: string;
  driver: string;
  vehicleId: string;
  carrier: string;
  scenario: TripPlan["scenario"];
  startTime: string;
  estimatedEndTime: string;
  plannedStops: string[];
  distanceKm: number;
}

interface FleetEvent {
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

interface Dataset {
  generatedAt: string;
  trips: TripSummary[];
  events: FleetEvent[];
  metadata: {
    version: string;
    generator: string;
    notes: string[];
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "fleet-events.json");

const tripPlans: TripPlan[] = [
  {
    id: "trip-long-haul",
    name: "Cross-Country Long Haul",
    scenario: "long-haul",
    driver: "Alyssa Chen",
    coDriver: "Marcus Reeves",
    vehicleId: "TX-2045",
    carrier: "MapUp Freight",
    route: [
      { label: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
      { label: "Boise, ID", lat: 43.615, lng: -116.2023 },
      { label: "Cheyenne, WY", lat: 41.1403, lng: -104.8202 },
      { label: "Kansas City, MO", lat: 39.0997, lng: -94.5786 },
      { label: "Columbus, OH", lat: 39.9612, lng: -82.9988 },
      { label: "Newark, NJ", lat: 40.7357, lng: -74.1724 }
    ],
    totalEvents: 10500,
    startTime: "2024-09-01T12:00:00Z",
    durationHours: 128,
    seed: 101,
  },
  {
    id: "trip-urban-delivery",
    name: "Urban Dense Delivery",
    scenario: "urban",
    driver: "Sofia Ramirez",
    vehicleId: "NY-5521",
    carrier: "MapUp City Logistics",
    route: [
      { label: "Brooklyn, NY", lat: 40.6782, lng: -73.9442 },
      { label: "Midtown Manhattan, NY", lat: 40.7549, lng: -73.984 },
      { label: "Queens, NY", lat: 40.7282, lng: -73.7949 },
      { label: "Bronx, NY", lat: 40.8448, lng: -73.8648 },
      { label: "Staten Island, NY", lat: 40.5795, lng: -74.1502 }
    ],
    totalEvents: 650,
    startTime: "2024-09-03T13:30:00Z",
    durationHours: 14,
    seed: 202,
  },
  {
    id: "trip-mountain-cancelled",
    name: "Mountain Route Cancelled",
    scenario: "mountain",
    driver: "Darius Cole",
    vehicleId: "CO-8834",
    carrier: "MapUp Mountain Ops",
    route: [
      { label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
      { label: "Georgetown, CO", lat: 39.7061, lng: -105.6972 },
      { label: "Vail Pass, CO", lat: 39.5339, lng: -106.1555 },
      { label: "Aspen, CO", lat: 39.1911, lng: -106.8175 }
    ],
    totalEvents: 140,
    startTime: "2024-10-10T05:00:00Z",
    durationHours: 9,
    seed: 303,
  },
  {
    id: "trip-southern-technical",
    name: "Southern Technical Issues",
    scenario: "technical",
    driver: "Priya Desai",
    vehicleId: "TX-7710",
    carrier: "MapUp Regional South",
    route: [
      { label: "Dallas, TX", lat: 32.7767, lng: -96.797 },
      { label: "Shreveport, LA", lat: 32.5252, lng: -93.7502 },
      { label: "Jackson, MS", lat: 32.2988, lng: -90.1848 },
      { label: "Montgomery, AL", lat: 32.3792, lng: -86.3077 },
      { label: "Atlanta, GA", lat: 33.749, lng: -84.388 },
      { label: "Savannah, GA", lat: 32.0809, lng: -81.0912 }
    ],
    totalEvents: 1150,
    startTime: "2024-09-12T09:45:00Z",
    durationHours: 46,
    seed: 404,
  },
  {
    id: "trip-regional-logistics",
    name: "Regional Logistics",
    scenario: "regional",
    driver: "Noah Patel",
    vehicleId: "IL-3288",
    carrier: "MapUp Regional Midwest",
    route: [
      { label: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
      { label: "Milwaukee, WI", lat: 43.0389, lng: -87.9065 },
      { label: "Madison, WI", lat: 43.0731, lng: -89.4012 },
      { label: "Rockford, IL", lat: 42.2711, lng: -89.0937 },
      { label: "Peoria, IL", lat: 40.6936, lng: -89.589 },
      { label: "Springfield, IL", lat: 39.7817, lng: -89.6501 },
      { label: "St. Louis, MO", lat: 38.627, lng: -90.1994 }
    ],
    totalEvents: 2100,
    startTime: "2024-09-08T06:15:00Z",
    durationHours: 52,
    seed: 505,
  },
];

const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function bearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cumulativeSegmentDistances(route: TripPlan["route"]): number[] {
  const distances: number[] = [0];
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += haversineDistanceKm(
      route[i - 1].lat,
      route[i - 1].lng,
      route[i].lat,
      route[i].lng
    );
    distances.push(total);
  }
  return distances;
}

function stringSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function interpolatePosition(
  route: TripPlan["route"],
  distances: number[],
  progress: number
) {
  const totalDistance = distances[distances.length - 1];
  const targetDistance = progress * totalDistance;

  let segmentIndex = 0;
  while (
    segmentIndex < distances.length - 1 &&
    targetDistance > distances[segmentIndex + 1]
  ) {
    segmentIndex += 1;
  }

  const segmentStartDistance = distances[segmentIndex];
  const segmentEndDistance = distances[segmentIndex + 1] ?? segmentStartDistance;
  const segmentProgress =
    segmentEndDistance === segmentStartDistance
      ? 0
      : (targetDistance - segmentStartDistance) /
        (segmentEndDistance - segmentStartDistance);

  const startPoint = route[segmentIndex];
  const endPoint = route[segmentIndex + 1] ?? route[segmentIndex];

  const lat =
    startPoint.lat + (endPoint.lat - startPoint.lat) * segmentProgress;
  const lng =
    startPoint.lng + (endPoint.lng - startPoint.lng) * segmentProgress;

  const heading = bearingDegrees(
    startPoint.lat,
    startPoint.lng,
    endPoint.lat,
    endPoint.lng
  );

  const cityHint =
    segmentProgress < 0.5 ? startPoint.label : endPoint.label ?? startPoint.label;

  return { lat, lng, heading, cityHint };
}

function baseSpeedForScenario(
  scenario: TripPlan["scenario"],
  progress: number
): number {
  switch (scenario) {
    case "long-haul":
      return 95 - Math.abs(progress - 0.5) * 20;
    case "urban":
      return 55 - Math.abs(progress - 0.3) * 25;
    case "mountain":
      return 65 - Math.abs(progress - 0.4) * 30;
    case "technical":
      return 85 - Math.abs(progress - 0.5) * 18;
    case "regional":
      return 80 - Math.abs(progress - 0.6) * 22;
    default:
      return 75;
  }
}

function fuelBurnRate(scenario: TripPlan["scenario"]): number {
  switch (scenario) {
    case "long-haul":
      return 0.00095;
    case "urban":
      return 0.0016;
    case "mountain":
      return 0.0013;
    case "technical":
      return 0.0011;
    case "regional":
      return 0.0012;
    default:
      return 0.001;
  }
}

function scenarioEvent(
  scenario: TripPlan["scenario"],
  progress: number,
  rng: () => number
): { type: EventType; status: EventStatus; meta: Record<string, unknown> } | null {
  const roll = rng();

  const beacon = (type: EventType, status: EventStatus, meta: Record<string, unknown> = {}) => ({
    type,
    status,
    meta,
  });

  switch (scenario) {
    case "long-haul":
      if (roll < 0.012) {
        return beacon("REST_STOP", "normal", {
          restMinutes: 30 + Math.round(rng() * 30),
          facility: rng() > 0.5 ? "truck plaza" : "service area",
        });
      }
      if (roll < 0.018) {
        return beacon("FUEL_LEVEL", "warning", {
          gallonsRemaining: 60 + Math.round(rng() * 40),
        });
      }
      break;

    case "urban":
      if (roll < 0.04) {
        return beacon("IDLE_ALERT", "warning", {
          idleMinutes: 5 + Math.round(rng() * 10),
          reason: rng() > 0.5 ? "traffic_congestion" : "delivery_stop",
        });
      }
      if (roll < 0.07 && progress > 0.35) {
        return beacon("SPEEDING_ALERT", "warning", {
          recordedSpeedKph: 70 + Math.round(rng() * 25),
          zoneLimitKph: 45 + Math.round(rng() * 10),
        });
      }
      break;

    case "mountain":
      if (progress > 0.5 && roll < 0.08) {
        return beacon("ROAD_HAZARD", "critical", {
          hazard: rng() > 0.5 ? "ice_patch" : "rockslide",
          advisory: "reduce_speed",
        });
      }
      if (progress > 0.6) {
        return beacon("TRIP_CANCELLED", "critical", {
          reason: "severe_weather",
          issuedBy: "dispatch_center",
        });
      }
      break;

    case "technical":
      if (roll < 0.03) {
        return beacon("DEVICE_OFFLINE", "warning", {
          durationMinutes: 5 + Math.round(rng() * 20),
          suspectedCause: rng() > 0.5 ? "sensor_fault" : "network_gap",
        });
      }
      if (roll < 0.05) {
        return beacon("BATTERY_DROP", "warning", {
          auxVoltage: 11 + (rng() * 1.5).toFixed(2),
        });
      }
      if (roll < 0.065) {
        return beacon("TRIP_DELAYED", "warning", {
          delayMinutes: 15 + Math.round(rng() * 45),
          reason: "device_troubleshooting",
        });
      }
      break;

    case "regional":
      if (roll < 0.025) {
        return beacon("FUEL_LEVEL", "warning", {
          gallonsRemaining: 50 + Math.round(rng() * 30),
          action: "plan_refuel",
        });
      }
      if (roll < 0.04) {
        return beacon("SERVICE_REMINDER", "normal", {
          code: "PM-7500",
          dueInKm: Math.round(200 + rng() * 150),
        });
      }
      if (roll < 0.05) {
        return beacon("DRIVER_CHECKIN", "normal", {
          checkpoint: "state_line",
          note: rng() > 0.5 ? "All systems nominal" : "Monitoring fuel burn",
        });
      }
      break;

    default:
      break;
  }

  if (roll < 0.01) {
    return beacon("HARSH_BRAKE", "warning", {
      deceleration: (2.5 + rng() * 2).toFixed(2),
      trigger: rng() > 0.5 ? "traffic" : "road_hazard",
    });
  }

  return null;
}

function generateTrip(plan: TripPlan): { summary: TripSummary; events: FleetEvent[] } {
  const rng = mulberry32(plan.seed ?? stringSeed(plan.id));
  const routeDistances = cumulativeSegmentDistances(plan.route);
  const totalDistanceKm = routeDistances[routeDistances.length - 1];
  const startDate = new Date(plan.startTime);
  const durationMs = plan.durationHours * 60 * 60 * 1000;
  const events: FleetEvent[] = [];

  let lastStatus: EventStatus = "normal";
  let fuelLevel = 100;
  let batteryLevel = 100;
  let odometerKm = 0;
  const fuelDecay = fuelBurnRate(plan.scenario) * totalDistanceKm;

  for (let i = 0; i < plan.totalEvents; i += 1) {
    const progress = i / Math.max(1, plan.totalEvents - 1);
    const timestamp = new Date(startDate.getTime() + durationMs * progress);
    const { lat, lng, heading, cityHint } = interpolatePosition(
      plan.route,
      routeDistances,
      progress
    );

    const baseSpeed =
      baseSpeedForScenario(plan.scenario, progress) *
      (0.92 + rng() * 0.16);
    const finalSpeed = Math.max(0, Math.min(120, baseSpeed));

    const distanceSinceLast =
      i === 0 ? 0 : (totalDistanceKm / plan.totalEvents) * (0.8 + rng() * 0.4);
    odometerKm += distanceSinceLast;
    fuelLevel = Math.max(5, 100 - fuelDecay * progress * (0.9 + rng() * 0.2));

    if (plan.scenario === "technical" && rng() < 0.02) {
      batteryLevel = Math.max(25, batteryLevel - (rng() * 4 + 1));
    } else {
      batteryLevel = Math.max(60, batteryLevel - rng() * 0.3);
    }

    const baseEvent: FleetEvent = {
      id: nanoid(),
      tripId: plan.id,
      type: "LOCATION_UPDATE",
      status: lastStatus,
      timestamp: timestamp.toISOString(),
      position: {
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
        cityHint,
      },
      speedKph: parseFloat(finalSpeed.toFixed(1)),
      odometerKm: parseFloat(odometerKm.toFixed(2)),
      fuelLevelPct: parseFloat(fuelLevel.toFixed(1)),
      batteryLevelPct:
        plan.scenario === "technical"
          ? parseFloat(batteryLevel.toFixed(1))
          : undefined,
      headingDeg: parseFloat(heading.toFixed(1)),
      meta: {
        engineOn: finalSpeed > 3,
        gpsFixQuality: rng() > 0.07 ? "good" : "fair",
        laneKeeping: rng() > 0.8 ? "manual" : "assisted",
      },
    };

    const special = scenarioEvent(plan.scenario, progress, rng);
    if (special) {
      baseEvent.type = special.type;
      baseEvent.status = special.status;
      baseEvent.meta = { ...baseEvent.meta, ...special.meta };
      lastStatus = special.status;
    } else {
      baseEvent.status =
        lastStatus === "normal" && rng() < 0.005 ? "warning" : lastStatus;
      if (baseEvent.status !== "normal" && rng() < 0.4) {
        lastStatus = "normal";
      }
    }

    if (rng() < 0.02) {
      baseEvent.meta = {
        ...baseEvent.meta,
        loadTemperatureC: parseFloat((2 + rng() * 4).toFixed(1)),
      };
    }

    events.push(baseEvent);
  }

  if (events.length > 0) {
    events[0].type = "TRIP_STARTED";
    events[0].status = "normal";
    events[0].meta = { ...events[0].meta, driverNote: "pre-trip inspection complete" };
  }

  const lastEvent = events[events.length - 1];
  if (plan.scenario === "mountain") {
    lastEvent.type = "TRIP_CANCELLED";
    lastEvent.status = "critical";
    lastEvent.meta = {
      ...lastEvent.meta,
      cancellationReason: "weather_advisory",
      authority: "Colorado DOT",
    };
  } else {
    lastEvent.type = "TRIP_COMPLETED";
    lastEvent.status = "normal";
    lastEvent.meta = {
      ...lastEvent.meta,
      deliveryWindowMet: rng() > 0.18,
      proofOfDelivery: rng() > 0.3 ? "signed" : "digital",
    };
  }

  const summary: TripSummary = {
    tripId: plan.id,
    name: plan.name,
    driver: plan.coDriver
      ? `${plan.driver} & ${plan.coDriver}`
      : plan.driver,
    vehicleId: plan.vehicleId,
    carrier: plan.carrier,
    scenario: plan.scenario,
    startTime: new Date(plan.startTime).toISOString(),
    estimatedEndTime: new Date(
      new Date(plan.startTime).getTime() + plan.durationHours * 60 * 60 * 1000
    ).toISOString(),
    plannedStops: plan.route.map((r) => r.label),
    distanceKm: parseFloat(totalDistanceKm.toFixed(2)),
  };

  return { summary, events };
}

async function main() {
  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    trips: [],
    events: [],
    metadata: {
      version: "1.0.0",
      generator: "MapUp Fleet Simulator (custom)",
      notes: [
        "Synthetic dataset simulating concurrent telemetry for five MapUp trips.",
        "Event stream sorted chronologically per trip; aggregate ordering preserved.",
        "Use `type` field to drive alerts, statuses, and domain-specific widgets."
      ],
    },
  };

  for (const plan of tripPlans) {
    const { summary, events } = generateTrip(plan);
    dataset.trips.push(summary);
    dataset.events.push(...events);
  }

  dataset.events.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ||
      a.tripId.localeCompare(b.tripId)
  );

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(dataset, null, 2), "utf-8");

  console.log(
    `✅ Generated ${dataset.events.length.toLocaleString()} events across ${dataset.trips.length} trips 👉 ${path.relative(
      process.cwd(),
      OUTPUT_FILE
    )}`
  );
}

main().catch((error) => {
  console.error("Failed to generate fleet data:", error);
  process.exit(1);
});

