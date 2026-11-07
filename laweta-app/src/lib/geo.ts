export type LatLng = { lat: number; lng: number };
export type Place = LatLng & { label: string };

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Odległość w linii prostej (km). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Szacunkowa odległość drogowa (MVP: linia prosta × współczynnik krętości). Docelowo OSRM/ORS. */
export function roadKm(a: LatLng, b: LatLng): number {
  return Math.max(0.5, haversineKm(a, b) * 1.3);
}

/** ETA w minutach (średnio 40 km/h w mieście + 3 min na wyjazd). */
export function etaMin(km: number): number {
  return Math.round(3 + (km / 40) * 60);
}

export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Wyszukiwanie adresu – Nominatim (OSM). Dla produkcji: własny Photon/Nominatim lub Google Places. */
export async function searchAddress(q: string, near?: LatLng): Promise<Place[]> {
  if (q.trim().length < 3) return [];
  const params = new URLSearchParams({ q, format: "json", limit: "5", countrycodes: "pl", "accept-language": "pl" });
  if (near) params.set("viewbox", `${near.lng - 0.5},${near.lat + 0.3},${near.lng + 0.5},${near.lat - 0.3}`);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const data = (await r.json()) as { lat: string; lon: string; display_name: string }[];
    return data.map((d) => ({ lat: +d.lat, lng: +d.lon, label: d.display_name.split(",").slice(0, 3).join(",") }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(p: LatLng): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${p.lat}&lon=${p.lng}&format=json&accept-language=pl&zoom=17`,
    );
    const d = (await r.json()) as { display_name?: string };
    return d.display_name?.split(",").slice(0, 2).join(",") ?? "Twoja lokalizacja";
  } catch {
    return "Twoja lokalizacja";
  }
}

export const WARSAW: LatLng = { lat: 52.2297, lng: 21.0122 };
