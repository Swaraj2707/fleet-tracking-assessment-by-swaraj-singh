import { useEffect } from "react";
import { useSimulationStore } from "./store/simulationStore";
import { useSimulationClock } from "./hooks/useSimulationClock";
import { SimulationControls } from "./components/SimulationControls";
import { FleetSummary } from "./components/FleetSummary";
import { TripsGrid } from "./components/TripsGrid";
import { ActivityFeed } from "./components/ActivityFeed";
import { FleetMap } from "./components/FleetMap";

export const App = () => {
  const status = useSimulationStore((state) => state.status);
  const error = useSimulationStore((state) => state.error);
  const loadData = useSimulationStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useSimulationClock();

  if (status === "loading" || status === "idle") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <h1>MapUp Fleet Tracking</h1>
          <p>Loading dataset&hellip;</p>
        </header>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app-shell">
        <header className="app-header error">
          <h1>MapUp Fleet Tracking</h1>
          <p>Unable to load dataset: {error}</p>
        </header>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>MapUp Fleet Tracking</h1>
          <p>Live simulation of five concurrent trips across the United States</p>
        </div>
        <SimulationControls />
      </header>

      <main className="app-grid">
        <section className="map-panel">
          <FleetMap />
        </section>

        <section className="summary-panel">
          <FleetSummary />
        </section>

        <section className="trips-panel">
          <TripsGrid />
        </section>

        <section className="activity-panel">
          <ActivityFeed />
        </section>
      </main>
    </div>
  );
};

