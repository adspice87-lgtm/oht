import type { JobStatus, PlaceKind, Situation, VehicleCategory } from "./types";

export const APP_NAME = "h0luj!";
export const SLOGAN = "Laweta w minutę. Cena z góry.";

export const CLIENT_STATUS: Record<JobStatus, (eta: number, company: string) => string> = {
  szukanie: () => "Czekamy na potwierdzenie kierowcy…",
  przyjete: () => "Operator przyjął zlecenie · zaraz wyjeżdża",
  w_drodze: (e) => (e <= 2 ? "Laweta jest blisko · ok. 2 min" : `Laweta jedzie do Ciebie · ${e} min`),
  na_miejscu: () => "Laweta na miejscu",
  zaladunek: () => "Ładujemy Twoje auto",
  w_transporcie: (e) => `W drodze do celu · ${e} min`,
  dostarczone: () => "Gotowe. Auto dostarczone",
  anulowane: () => "Zlecenie anulowane",
};

export const STATUS_SHORT: Record<JobStatus, string> = {
  szukanie: "Nowe",
  przyjete: "Przyjęte",
  w_drodze: "W drodze",
  na_miejscu: "Na miejscu",
  zaladunek: "Załadunek",
  w_transporcie: "Transport",
  dostarczone: "Dostarczone",
  anulowane: "Anulowane",
};

/** Kolejny krok dla laweciarza – jeden duży przycisk. */
export const DRIVER_NEXT: Partial<Record<JobStatus, { label: string; next: JobStatus }>> = {
  przyjete: { label: "Jadę", next: "w_drodze" },
  w_drodze: { label: "Jestem na miejscu", next: "na_miejscu" },
  na_miejscu: { label: "Zaczynam załadunek", next: "zaladunek" },
  zaladunek: { label: "Auto załadowane – jadę", next: "w_transporcie" },
  w_transporcie: { label: "Zakończ – dostarczone", next: "dostarczone" },
};

export const SITUATIONS: { id: Situation; label: string; emoji: string }[] = [
  { id: "nie_odpala", label: "Nie odpala", emoji: "🔋" },
  { id: "awaria", label: "Awaria w trasie", emoji: "⚙️" },
  { id: "wypadek", label: "Wypadek / kolizja", emoji: "💥" },
  { id: "kapec", label: "Koło / opona", emoji: "🛞" },
  { id: "zakup", label: "Przewóz auta (zakup)", emoji: "🚗" },
  { id: "inne", label: "Inne", emoji: "❓" },
];

export const CATEGORIES: { id: VehicleCategory; label: string; hint: string }[] = [
  { id: "osobowy", label: "Osobowe", hint: "hatchback, sedan, kombi" },
  { id: "suv_van", label: "SUV / bus", hint: "do 3,5 t" },
  { id: "motocykl", label: "Motocykl", hint: "skuter, quad" },
  { id: "ciezki", label: "Ciężkie", hint: "pow. 3,5 t" },
];

export const PLACES: { id: PlaceKind; label: string }[] = [
  { id: "ulica", label: "Ulica / pobocze" },
  { id: "parking", label: "Parking" },
  { id: "autostrada", label: "Autostrada / S-ka" },
  { id: "parking_podziemny", label: "Garaż podziemny" },
  { id: "pole_row", label: "Rów / teren" },
];
