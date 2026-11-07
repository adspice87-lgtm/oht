import { DEFAULT_PRICING } from "./pricing";
import type { Driver } from "./types";

const P = DEFAULT_PRICING;

export const ME_ID = "me";

export const MOCK_DRIVERS: Driver[] = [
  { id: "d1", name: "Marek", company: "Auto-Hol Marek Nowak", phone: "+48 600 100 201", rating: 4.9, jobs: 412, truck: "laweta", maxKg: 3500, plate: "WX 4K21", verified: true, online: true, pos: { lat: 52.2405, lng: 20.9921 }, pricing: { ...P, startFee: 140, perKmLoaded: 4 } },
  { id: "d2", name: "Paweł", company: "Lawety 24h Mokotów", phone: "+48 600 100 202", rating: 4.7, jobs: 233, truck: "laweta", maxKg: 3500, plate: "WI 7720P", verified: true, online: true, pos: { lat: 52.1934, lng: 21.0345 }, pricing: { ...P, startFee: 160, perKmLoaded: 4 } },
  { id: "d3", name: "Tomasz", company: "TomHol – pomoc drogowa", phone: "+48 600 100 203", rating: 4.8, jobs: 587, truck: "laweta_hds", maxKg: 3500, plate: "WZ 99TH", verified: true, online: true, pos: { lat: 52.2611, lng: 21.0519 }, pricing: { ...P, startFee: 200, perKmLoaded: 5, surDitch: 300 } },
  { id: "d4", name: "Krzysztof", company: "Holowanie Praga", phone: "+48 600 100 204", rating: 4.5, jobs: 98, truck: "holownik", maxKg: 2500, plate: "WPR 1234", verified: false, online: true, pos: { lat: 52.2551, lng: 21.0343 }, pricing: { ...P, startFee: 120, perKmLoaded: 3.5, minPrice: 200 } },
  { id: "d5", name: "Adam", company: "Ad-Trans Lawety", phone: "+48 600 100 205", rating: 4.9, jobs: 801, truck: "laweta", maxKg: 4500, plate: "WE 5AD55", verified: true, online: true, pos: { lat: 52.1711, lng: 20.9712 }, pricing: { ...P, startFee: 170, perKmLoaded: 4.5 } },
  { id: "d6", name: "Grzegorz", company: "Big-Hol ciężka pomoc", phone: "+48 600 100 206", rating: 4.6, jobs: 154, truck: "ciezka", maxKg: 26000, plate: "WGM 66BH", verified: true, online: true, pos: { lat: 52.2152, lng: 20.9005 }, pricing: { ...P, startFee: 600, perKmLoaded: 12, perKmApproach: 8, minPrice: 900 } },
  { id: "d7", name: "Łukasz", company: "Szybka Laweta Wola", phone: "+48 600 100 207", rating: 4.4, jobs: 61, truck: "laweta", maxKg: 3500, plate: "WW 3L7K", verified: true, online: true, pos: { lat: 52.2318, lng: 20.9601 }, pricing: { ...P, startFee: 130, perKmLoaded: 4, minPrice: 220 } },
  { id: "d8", name: "Rafał", company: "Rafi-Hol Białołęka", phone: "+48 600 100 208", rating: 4.8, jobs: 276, truck: "laweta", maxKg: 3500, plate: "WB 2R8F", verified: true, online: false, pos: { lat: 52.3176, lng: 21.0024 }, pricing: { ...P } },
];

export const ME_DRIVER_DEFAULT: Driver = {
  id: ME_ID,
  name: "Ty",
  company: "Twoja firma (demo)",
  phone: "+48 500 000 000",
  rating: 5,
  jobs: 0,
  truck: "laweta",
  maxKg: 3500,
  plate: "WA 00000",
  verified: true,
  online: false,
  pos: { lat: 52.2231, lng: 21.0067 },
  pricing: { ...P },
};
