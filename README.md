# MapUp Fleet Tracking Dashboard

Real-time fleet management dashboard that replays five simultaneous trips across the United States. The application consumes a 14k+ event telemetry dataset and simulates live playback so dispatchers can monitor vehicle movement, health, and alerts from a single view.

## Features

- Live simulation with adjustable playback speed (1x, 5x, 10x, 30x, 60x) and seekable timeline.
- Fleet-wide overview cards summarising active, completed, delayed, and cancelled trips plus live alert counts.
- Interactive Leaflet map plotting the current position of each vehicle with status-aware styling.
- Trip detail grid with progress bars, distance, speed, fuel/battery levels, and latest event context.
- Rolling activity feed highlighting the most recent alerts and operational events.
- Synthetic dataset generator producing 5 distinct scenarios (long haul, urban delivery, mountain cancellation, technical fault route, and regional logistics).

## Tech Stack

- React 18 + TypeScript + Vite.
- Zustand for simulation state management.
- Leaflet via `react-leaflet` for mapping.
- `date-fns` for human-friendly time formatting.

## Getting Started

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:5173`. The dashboard auto-plays the simulation once the dataset loads. Use the controls in the header to pause, change speed, or scrub through the trip timeline.

### Building for Production

```bash
npm run build
npm run preview
```

`npm run build` compiles the app into the `dist/` directory. Serve that folder with any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.). The app expects the dataset at `/data/fleet-events.json`; ensure that file is published alongside the build output.

## Data Generation

The repository includes a custom simulator that emits a unique dataset honouring the MapUp assessment specification. Regenerate data at any time:

```bash
npm run generate:data
```

The script writes `public/data/fleet-events.json`. Each trip plan is seeded for deterministic structure but incorporates random noise so every run stays realistic. The generated file contains:

- `trips`: metadata for the five concurrent trips (names, drivers, schedule, distance, planned stops).
- `events`: chronologically ordered telemetry with 27+ event types, alert severities, fuel/battery updates, and geographic coordinates.
- `metadata`: generator provenance for auditability.

## Architecture Notes

- `src/store/simulationStore.ts` handles loading, chronological playback, alert tracking, and derived fleet metrics. Rewinding is supported via a reset + fast-forward strategy to keep the state consistent.
- `src/hooks/useSimulationClock.ts` advances the simulated clock on a 250 ms tick, scaled by the selected speed multiplier.
- UI is divided into dedicated panels (`FleetMap`, `FleetSummary`, `TripsGrid`, `ActivityFeed`, `SimulationControls`) for clarity and responsiveness.
- Styling (`src/style.css`) emphasises concise visual hierarchy and adapts down to tablet widths without losing insight density.

## Deployment Checklist

1. Run `npm run build` and verify locally with `npm run preview`.
2. Upload the contents of `dist/` and `public/data/fleet-events.json` to your hosting provider.
3. Set the site to serve from the project root so `/data/fleet-events.json` resolves correctly.
4. Smoke-test the live URL: ensure the map renders, simulation auto-starts, controls respond, and the activity feed streams events.
5. Share the private repository with the MapUp reviewers (`vedantp@mapup.ai`, `ajayap@mapup.ai`, `asijitp@mapup.ai`, `atharvd@mapup.ai`, `karkuvelpandip@mapup.ai`) and submit the final link via the provided Google Form.

## Testing Ideas

- Validate playback controls by scrubbing to early, mid, and late timestamps and confirming metrics update coherently.
- Pause and resume to ensure the simulation clock holds position and restarts without jumps.
- Inspect the console/network tab to confirm `/data/fleet-events.json` loads successfully in production.
- Regenerate the dataset to verify the app adapts to new telemetry without code changes.

## License

Private assessment project for MapUp — do not distribute without permission.


