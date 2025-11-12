import type { ChangeEvent } from "react";
import { useSimulationStore } from "../store/simulationStore";
import { formatTime } from "../utils/format";

const SPEED_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "5x", value: 5 },
  { label: "10x", value: 10 },
  { label: "30x", value: 30 },
  { label: "60x", value: 60 },
];

export const SimulationControls = () => {
  const playing = useSimulationStore((state) => state.playing);
  const setPlaying = useSimulationStore((state) => state.setPlaying);
  const speedMultiplier = useSimulationStore((state) => state.speedMultiplier);
  const setSpeedMultiplier = useSimulationStore((state) => state.setSpeedMultiplier);
  const simulationTimeMs = useSimulationStore((state) => state.simulationTimeMs);
  const startTimeMs = useSimulationStore((state) => state.startTimeMs);
  const endTimeMs = useSimulationStore((state) => state.endTimeMs);
  const stepTo = useSimulationStore((state) => state.stepTo);
  const reset = useSimulationStore((state) => state.reset);

  const totalDuration = endTimeMs - startTimeMs || 1;
  const progress = Math.min(
    100,
    Math.max(0, ((simulationTimeMs - startTimeMs) / totalDuration) * 100)
  );

  const handleSlider = (event: ChangeEvent<HTMLInputElement>) => {
    const pct = Number(event.target.value) / 100;
    const next = startTimeMs + pct * totalDuration;
    stepTo(next);
  };

  return (
    <div className="controls">
      <div className="controls-primary">
        <button
          className="btn"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause simulation" : "Play simulation"}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button className="btn ghost" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="controls-meta">
        <div className="speed-selector">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`btn ghost ${speedMultiplier === option.value ? "active" : ""}`}
              onClick={() => setSpeedMultiplier(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="timestamp">
          <span>{formatTime(simulationTimeMs, "MMM d, yyyy 'at' HH:mm")}</span>
        </div>
      </div>

      <div className="controls-slider">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={handleSlider}
          aria-label="Simulation progress"
        />
        <div className="slider-labels">
          <span>{formatTime(startTimeMs, "MMM d HH:mm")}</span>
          <span>{formatTime(endTimeMs, "MMM d HH:mm")}</span>
        </div>
      </div>
    </div>
  );
};

