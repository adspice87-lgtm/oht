import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "../lib/geo";

const truckSvg = (color: string, active = false) => `
<div style="transform:translate(-50%,-50%);position:absolute;left:50%;top:50%">
  <div style="width:${active ? 44 : 36}px;height:${active ? 44 : 36}px;border-radius:12px;background:${color};display:grid;place-items:center;box-shadow:0 4px 12px rgba(14,26,43,.35);border:2px solid #fff">
    <svg width="${active ? 26 : 20}" height="${active ? 26 : 20}" viewBox="0 0 24 24" fill="none" stroke="#0E1A2B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16V8h11v8"/><path d="M13 11h4l3 3v2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>
  </div>
</div>`;

export const truckIcon = (color = "#FF7A00", active = false) =>
  L.divIcon({ className: "truck-icon", html: truckSvg(color, active), iconSize: [0, 0] });

export const pinIcon = (color: string, letter: string) =>
  L.divIcon({
    className: "pin-icon",
    iconSize: [0, 0],
    html: `<div style="position:absolute;transform:translate(-50%,-100%)"><div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3);display:grid;place-items:center"><span style="transform:rotate(45deg);color:#fff;font-weight:800;font-size:14px">${letter}</span></div></div>`,
  });

export const meIcon = L.divIcon({
  className: "pin-icon",
  iconSize: [0, 0],
  html: `<div style="position:absolute;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:#2563EB;border:4px solid #fff;box-shadow:0 0 0 8px rgba(37,99,235,.2)"></div>`,
});

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|");
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14, { animate: true });
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [50, 50], maxZoom: 15, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function Click({ onClick }: { onClick?: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export type MapMarker = { id: string; pos: LatLng; icon: L.DivIcon; label?: string; onClick?: () => void };

export default function MapView({
  center,
  markers,
  fit = [],
  route,
  onMapClick,
  dark,
  className = "",
}: {
  center: LatLng;
  markers: MapMarker[];
  fit?: LatLng[];
  route?: LatLng[];
  onMapClick?: (p: LatLng) => void;
  dark?: boolean;
  className?: string;
}) {
  return (
    <MapContainer center={center} zoom={13} zoomControl={false} attributionControl={false} className={`h-full w-full ${className}`}>
      <TileLayer
        url={dark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
      />
      {route && route.length > 1 && <Polyline positions={route.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#FF7A00", weight: 5, dashArray: "8 10" }} />}
      {markers.map((m) => (
        <Marker key={m.id} position={m.pos} icon={m.icon} eventHandlers={m.onClick ? { click: m.onClick } : undefined}>
          {m.label && <Tooltip direction="top" offset={[0, -22]}>{m.label}</Tooltip>}
        </Marker>
      ))}
      <Fit points={fit} />
      <Click onClick={onMapClick} />
    </MapContainer>
  );
}
