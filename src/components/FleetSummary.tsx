import { useSimulationStore } from "../store/simulationStore";
import { formatSpeed } from "../utils/format";

export const FleetSummary = () => {
  const metrics = useSimulationStore((state) => state.fleetMetrics);

  const summaryItems = [
    { label: "Active Trips", value: metrics.activeTrips },
    { label: "Completed Trips", value: metrics.completedTrips },
    { label: "Delayed Trips", value: metrics.delayedTrips },
    { label: "Cancelled Trips", value: metrics.cancelledTrips },
    { label: "Fleet Avg Speed", value: formatSpeed(metrics.averageFleetSpeed) },
    { label: "Critical Alerts", value: metrics.criticalAlerts },
    { label: "Warning Alerts", value: metrics.warningAlerts },
  ];

  return (
    <div className="fleet-summary">
      {summaryItems.map((item) => (
        <div key={item.label} className="summary-card">
          <span className="summary-label">{item.label}</span>
          <span className="summary-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

