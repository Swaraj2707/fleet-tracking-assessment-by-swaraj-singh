import { useSimulationStore } from "../store/simulationStore";
import {
  formatTime,
  formatRelativeTime,
  formatSpeed,
  formatPercent,
} from "../utils/format";

export const ActivityFeed = () => {
  const recentEvents = useSimulationStore((state) => state.recentEvents);
  const trips = useSimulationStore((state) => state.trips);
  const simulationTimeMs = useSimulationStore((state) => state.simulationTimeMs);

  const tripLookup = new Map(trips.map((trip) => [trip.tripId, trip]));

  return (
    <div className="activity-feed">
      <h2>Latest Events</h2>
      <ul>
        {recentEvents
          .slice(-25)
          .reverse()
          .map((event) => {
            const trip = tripLookup.get(event.tripId);
            const statusClass =
              event.status === "critical"
                ? "critical"
                : event.status === "warning"
                ? "warning"
                : "normal";
            return (
              <li key={event.id} className={`feed-item ${statusClass}`}>
                <div className="feed-item__header">
                  <span className="feed-item__type">
                    {event.type.replaceAll("_", " ")}
                  </span>
                  <time dateTime={event.timestamp}>
                    {formatTime(event.timestampMs, "HH:mm")} •{" "}
                    {formatRelativeTime(event.timestampMs, simulationTimeMs)}
                  </time>
                </div>
                <div className="feed-item__meta">
                  <span>{trip?.name ?? event.tripId}</span>
                  <span>{event.position.cityHint}</span>
                </div>
                <div className="feed-item__metrics">
                  <span>{formatSpeed(event.speedKph)}</span>
                  <span>{formatPercent(event.fuelLevelPct)} fuel</span>
                  {event.batteryLevelPct !== undefined && (
                    <span>{formatPercent(event.batteryLevelPct)} battery</span>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

