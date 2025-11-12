import { useEffect } from "react";
import { useSimulationStore } from "../store/simulationStore";

const TICK_INTERVAL_MS = 250;

export const useSimulationClock = () => {
  const playing = useSimulationStore((state) => state.playing);
  const speedMultiplier = useSimulationStore((state) => state.speedMultiplier);
  const simulationTimeMs = useSimulationStore((state) => state.simulationTimeMs);
  const stepTo = useSimulationStore((state) => state.stepTo);

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      const deltaMs = TICK_INTERVAL_MS * speedMultiplier;
      stepTo(simulationTimeMs + deltaMs);
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [playing, speedMultiplier, simulationTimeMs, stepTo]);
};

