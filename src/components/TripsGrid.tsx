import { useMemo } from "react";
import { useSimulationStore } from "../store/simulationStore";
import {
  formatDistance,
  formatPercent,
  formatRelativeTime,
  formatSpeed,
} from "../utils/format";
import type { TripStatus } from "../types";

const statusLabel: Record<TripStatus, string> = {
  scheduled: "Scheduled",
  en_route: "En Route",
  delayed: "Delayed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TripsGrid = () => {
  const tripStates = useSimulationStore((state) => state.tripStates);
  const simulationTimeMs = useSimulationStore((state) => state.simulationTimeMs);

  const entries = useMemo(
    () =>
      Object.values(tripStates).sort((a, b) =>
        a.trip.name.localeCompare(b.trip.name)
      ),
    [tripStates]
  );

  return (
    <div className="trips-grid">
      {entries.map((state) => {
        const { trip, lastEvent } = state;
        return (
          <article key={trip.tripId} className={`trip-card status-${state.status}`}>
            <header className="trip-card__header">
              <div>
                <h3>{trip.name}</h3>
                <p>
                  {trip.driver} • {trip.vehicleId}
                </p>
              </div>
              <span className="status-badge">{statusLabel[state.status]}</span>
            </header>

            <div className="trip-card__progress">
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${state.progressPct}%` }}
                  aria-valuenow={state.progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span>{formatPercent(state.progressPct)}</span>
            </div>

            <dl className="trip-card__metrics">
              <div>
                <dt>Distance</dt>
                <dd>{formatDistance(state.distanceTravelledKm)}</dd>
              </div>
              <div>
                <dt>Current Speed</dt>
                <dd>{formatSpeed(state.currentSpeedKph)}</dd>
              </div>
              <div>
                <dt>Average Speed</dt>
                <dd>{formatSpeed(state.avgSpeedKph)}</dd>
              </div>
              <div>
                <dt>Fuel</dt>
                <dd>{formatPercent(state.fuelLevelPct)}</dd>
              </div>
              {state.batteryLevelPct !== undefined && (
                <div>
                  <dt>Battery</dt>
                  <dd>{formatPercent(state.batteryLevelPct)}</dd>
                </div>
              )}
            </dl>

            {lastEvent && (
              <footer className="trip-card__footer">
                <span>{lastEvent.type.replaceAll("_", " ")}</span>
                <time dateTime={lastEvent.timestamp}>
                  {formatRelativeTime(lastEvent.timestampMs, simulationTimeMs)}
                </time>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
};

