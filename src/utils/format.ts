import { format } from "date-fns";

export const formatTime = (timestampMs: number, pattern = "MMM d, HH:mm") =>
  format(timestampMs, pattern);

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

export const formatDistance = (km: number) => `${km.toFixed(1)} km`;

export const formatSpeed = (kph: number) => `${kph.toFixed(1)} km/h`;

export const formatPercent = (pct: number) => `${pct.toFixed(0)}%`;

export const formatRelativeTime = (targetMs: number, baseMs: number) => {
  const diff = targetMs - baseMs;
  if (diff === 0) return "now";
  const minutes = Math.round(Math.abs(diff) / (60 * 1000));
  const label = minutes <= 1 ? "1 minute" : `${minutes} minutes`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
};

