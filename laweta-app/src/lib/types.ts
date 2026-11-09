import type { LatLng, Place } from "./geo";

export type TruckType = "laweta" | "laweta_hds" | "holownik" | "ciezka";

export type Pricing = {
  startFee: number; // opłata startowa (zł) – obejmuje załadunek i rozładunek
  freeApproachKm: number; // km dojazdu w cenie startowej
  perKmApproach: number; // zł/km dojazdu ponad limit
  perKmLoaded: number; // zł/km z autem na lawecie
  minPrice: number; // cena minimalna (zł)
  nightMult: number; // mnożnik 22:00–6:00, np. 1.3
  weekendMult: number; // mnożnik sob/nd, np. 1.2
  surHighway: number; // dopłata autostrada/ekspresówka
  surNotRolling: number; // koła zablokowane / nie toczy się
  surUnderground: number; // garaż podziemny (wózki)
  surSuvVan: number; // SUV / bus do 3,5 t
  surDitch: number; // rów / teren (cena „od”)
  waitRate15: number; // postój za każde 15 min po pierwszych 15 (poza ceną z góry)
};

export type Driver = {
  id: string;
  name: string;
  company: string;
  phone: string;
  rating: number;
  jobs: number;
  truck: TruckType;
  maxKg: number;
  plate: string;
  verified: boolean;
  online: boolean;
  busyUntil?: number; // demo: zajęta (inne zlecenie) do tego czasu
  pos: LatLng;
  pricing: Pricing;
};

export type VehicleCategory = "osobowy" | "suv_van" | "motocykl" | "ciezki";
export type Situation = "awaria" | "wypadek" | "nie_odpala" | "kapec" | "zakup" | "inne";
export type PlaceKind = "ulica" | "parking" | "autostrada" | "parking_podziemny" | "pole_row";

export type VehicleInfo = {
  category: VehicleCategory;
  situation: Situation;
  rolls: boolean; // czy koła się kręcą / da się przetoczyć
  steering: boolean; // czy kierownica się kręci
  lowered: boolean; // auto obniżone / sportowe
  electric: boolean;
  awd: boolean; // 4x4 / AWD / automat na dłuższą trasę
  placeKind: PlaceKind;
  passengers: number;
  garageHeightCm?: number;
  keys: boolean;
  makeModel: string;
  note: string;
};

export type JobStatus =
  | "szukanie"
  | "przyjete"
  | "w_drodze"
  | "na_miejscu"
  | "zaladunek"
  | "w_transporcie"
  | "dostarczone"
  | "anulowane";

export type ChatMessage = { from: "client" | "driver"; text: string; at: number };

export type WalletTx = { at: number; amount: number; label: string };

export type JobEvent = { status: JobStatus; at: number };

export type PriceBreakdown = {
  approachKm: number;
  loadedKm: number;
  items: { label: string; amount: number }[];
  total: number;
};

export type Job = {
  id: string;
  createdAt: number;
  pickup: Place;
  dropoff: Place;
  vehicle: VehicleInfo;
  phone: string;
  clientName: string;
  driverId: string;
  price: PriceBreakdown;
  status: JobStatus;
  events: JobEvent[];
  truckPos: LatLng;
  rating?: number;
  fee?: number; // prowizja Holuj pobrana od laweciarza przy akceptacji
  messages: ChatMessage[];
};
