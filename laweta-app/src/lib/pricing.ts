import { roadKm, type LatLng } from "./geo";
import type { Driver, PriceBreakdown, Pricing, TruckType, VehicleInfo } from "./types";

/** Domyślne stawki (orientacyjne zakresy rynkowe PL – patrz docs/02-ekspert-lawety.md). */
export const DEFAULT_PRICING: Pricing = {
  startFee: 150,
  freeApproachKm: 10,
  perKmApproach: 2.5,
  perKmLoaded: 4,
  minPrice: 250,
  nightMult: 1.3,
  weekendMult: 1.2,
  surHighway: 100,
  surNotRolling: 80,
  surUnderground: 120,
  surSuvVan: 80,
  surDitch: 250,
  waitRate15: 40,
};

export const TRUCK_LABEL: Record<TruckType, string> = {
  laweta: "Laweta najazdowa",
  laweta_hds: "Laweta z HDS / wyciągarką",
  holownik: "Pomoc kołowa (holownik)",
  ciezka: "Ciężka pomoc (>3,5 t)",
};

export function isNight(d = new Date()) {
  const h = d.getHours();
  return h >= 22 || h < 6;
}
export function isWeekend(d = new Date()) {
  const w = d.getDay();
  return w === 0 || w === 6;
}

/** Reguły dopasowania lawety do zgłoszenia (ekspert branżowy). */
export function truckFits(driver: Driver, v: VehicleInfo): boolean {
  if (v.category === "ciezki") return driver.truck === "ciezka";
  if (driver.truck === "ciezka") return false; // ciężka pomoc nie jeździ do osobówek w MVP
  if (driver.truck === "holownik") {
    // pomoc kołowa: nie dla elektryków, 4x4/AWD, zablokowanych kół, motocykli, rowu
    if (v.electric || v.awd || !v.rolls || v.category === "motocykl" || v.placeKind === "pole_row") return false;
  }
  if (v.category === "suv_van" && driver.maxKg < 3500) return false;
  if (v.placeKind === "pole_row" && driver.truck !== "laweta_hds") return false;
  return true;
}

/**
 * suma  = start + max(0, km_dojazdu − km_gratis) × zł/km_dojazdu + km_z_autem × zł/km + dopłaty
 * mnożnik = najwyższy aktywny (noc / weekend) – NIE mnożymy przez siebie
 * cena  = ceil(max(minimalna, suma × mnożnik) / 10) × 10
 * Cena blokowana przy zamówieniu. Postój (po 15 min) liczony osobno na miejscu.
 */
export function quote(p: Pricing, driverPos: LatLng, pickup: LatLng, dropoff: LatLng, v: VehicleInfo, when = new Date()): PriceBreakdown {
  const approachKm = roadKm(driverPos, pickup);
  const loadedKm = roadKm(pickup, dropoff);
  const items: { label: string; amount: number }[] = [];
  const r = Math.round;

  items.push({ label: "Opłata startowa (załadunek + rozładunek)", amount: p.startFee });
  const extra = Math.max(0, approachKm - p.freeApproachKm);
  if (extra > 0) items.push({ label: `Dojazd ponad ${p.freeApproachKm} km: ${extra.toFixed(1)} km × ${p.perKmApproach} zł`, amount: r(extra * p.perKmApproach) });
  items.push({ label: `Transport ${loadedKm.toFixed(1)} km × ${p.perKmLoaded} zł`, amount: r(loadedKm * p.perKmLoaded) });
  if (v.placeKind === "autostrada") items.push({ label: "Autostrada / droga ekspresowa", amount: p.surHighway });
  if (!v.rolls || !v.steering) items.push({ label: "Auto się nie toczy / nie skręca", amount: p.surNotRolling });
  if (v.placeKind === "parking_podziemny") items.push({ label: "Garaż podziemny", amount: p.surUnderground });
  if (v.category === "suv_van") items.push({ label: "SUV / bus do 3,5 t", amount: p.surSuvVan });
  if (v.placeKind === "pole_row") items.push({ label: "Wyciąganie z rowu / teren (od)", amount: p.surDitch });

  const sum = items.reduce((s, i) => s + i.amount, 0);
  const night = isNight(when), weekend = isWeekend(when);
  const mult = Math.max(1, night ? p.nightMult : 1, weekend ? p.weekendMult : 1);
  if (mult > 1) {
    const which = night && p.nightMult >= (weekend ? p.weekendMult : 0) ? "nocna" : "weekendowa";
    items.push({ label: `Stawka ${which} ×${mult}`, amount: r(sum * (mult - 1)) });
  }
  const raw = Math.max(p.minPrice, sum * mult);
  const total = Math.ceil(raw / 10) * 10;
  const shown = items.reduce((s, i) => s + i.amount, 0);
  if (total !== shown) items.push({ label: total > sum * mult + 9 ? "Wyrównanie do ceny minimalnej" : "Zaokrąglenie", amount: total - shown });
  return { approachKm, loadedKm, items, total };
}
