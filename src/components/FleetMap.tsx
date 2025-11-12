import { useMemo } from "react";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulationStore } from "../store/simulationStore";
import { formatSpeed, formatPercent } from "../utils/format";

const STATUS_COLOR: Record<string, string> = {
  scheduled: "#9ca3af",
  en_route: "#2563eb",
  delayed: "#f97316",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

const USA_CENTER: LatLngTuple = [39.5, -98.35];

export const FleetMap = () => {
  const tripStates = useSimulationStore((state) => state.tripStates);

  const markers = useMemo(() => {
    return Object.values(tripStates)
      .filter((state) => state.lastEvent)
      .map((state) => ({
        runtime: state,
        position: [
          state.lastEvent!.position.lat,
          state.lastEvent!.position.lng,
        ] as LatLngTuple,
      }));
  }, [tripStates]);

  const center = useMemo<LatLngExpression>(() => {
    if (markers.length === 0) return USA_CENTER;
    const sum = markers.reduce(
      (acc, marker) => {
        acc.lat += marker.position[0];
        acc.lng += marker.position[1];
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return [sum.lat / markers.length, sum.lng / markers.length] as [number, number];
  }, [markers]);

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom={false} className="fleet-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map(({ runtime, position }) => (
        <CircleMarker
          key={runtime.trip.tripId}
          center={position}
          radius={10}
          pathOptions={{
            color: STATUS_COLOR[runtime.status] ?? "#2563eb",
            fillColor: STATUS_COLOR[runtime.status] ?? "#2563eb",
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <strong>{runtime.trip.name}</strong>
            <div className="map-popup__meta">
              <span>{runtime.trip.driver}</span>
              <span>{runtime.trip.vehicleId}</span>
            </div>
            <ul>
              <li>Status: {runtime.status.replaceAll("_", " ")}</li>
              <li>Speed: {formatSpeed(runtime.currentSpeedKph)}</li>
              <li>Fuel: {formatPercent(runtime.fuelLevelPct)}</li>
              <li>Progress: {formatPercent(runtime.progressPct)}</li>
            </ul>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

