import { useSyncExternalStore } from "react";
import { etaMin, lerp, roadKm } from "./geo";
import { ME_DRIVER_DEFAULT, ME_ID, MOCK_DRIVERS } from "./mock";
import { CANCEL_PENALTY, platformFee, START_BONUS } from "./fees";
import type { ChatMessage, Driver, Job, JobStatus, WalletTx } from "./types";

/**
 * Prosty store MVP: localStorage + BroadcastChannel (synchronizacja między kartami).
 * Otwórz klienta w jednej karcie i laweciarza w drugiej – zlecenia przechodzą na żywo.
 * W wersji produkcyjnej zastępujemy to Supabase (tabele jobs/driver_locations + Realtime).
 */
export type Mode = "client" | "driver";
type State = {
  mode: Mode;
  isDriver: boolean; // czy użytkownik zarejestrował się jako laweciarz (Ustawienia → Zostań laweciarzem)
  me: Driver;
  wallet: { balance: number; txs: WalletTx[] };
  jobs: Job[];
  activeJobId: string | null;
};

const KEY = "holuj-mvp-v2";
const chan = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(KEY) : null;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* ignore */
  }
  return initial();
}

const initial = (): State => ({ mode: "client", isDriver: false, me: ME_DRIVER_DEFAULT, wallet: { balance: 0, txs: [] }, jobs: [], activeJobId: null });

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: State, broadcast = true) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  if (broadcast) chan?.postMessage(state);
  emit();
}

chan?.addEventListener("message", (e) => set(e.data as State, false));

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sel(state),
  );
}

export const getState = () => state;

export function allDrivers(s: Pick<State, "me"> = state): Driver[] {
  return [...MOCK_DRIVERS, s.me];
}

/** Drobne „pływanie” pozycji mockowych lawet, żeby mapa żyła. */
export function livePos(d: Driver, now: number) {
  if (d.id === ME_ID) return d.pos;
  const k = parseInt(d.id.slice(1), 10);
  return { lat: d.pos.lat + Math.sin(now / 20000 + k) * 0.0025, lng: d.pos.lng + Math.cos(now / 26000 + k * 2) * 0.004 };
}

export function updateMe(patch: Partial<Driver>) {
  set({ ...state, me: { ...state.me, ...patch } });
}

export function createJob(job: Job) {
  set({ ...state, jobs: [job, ...state.jobs], activeJobId: job.id });
}

/** Zlecenie bez przełączania widoku klienta (np. testowe zlecenie z panelu laweciarza). */
export function addJob(job: Job) {
  set({ ...state, jobs: [job, ...state.jobs] });
}

export function setStatus(id: string, status: JobStatus) {
  set({
    ...state,
    jobs: state.jobs.map((j) => (j.id === id ? { ...j, status, events: [...j.events, { status, at: Date.now() }] } : j)),
  });
}

export function patchJob(id: string, patch: Partial<Job>) {
  set({ ...state, jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) });
}

export function clearActive() {
  set({ ...state, activeJobId: null });
}

export function resetDemo() {
  set(initial());
}

export function setMode(mode: Mode) {
  set({ ...state, mode });
}

export function becomeDriver(profile: Partial<Driver>) {
  set({
    ...state,
    isDriver: true,
    mode: "driver",
    me: { ...state.me, ...profile },
    wallet: { balance: START_BONUS, txs: [{ at: Date.now(), amount: START_BONUS, label: "Bonus startowy" }] },
  });
}

export function topUp(amount: number) {
  set({ ...state, wallet: { balance: state.wallet.balance + amount, txs: [{ at: Date.now(), amount, label: "Doładowanie portfela" }, ...state.wallet.txs] } });
}

/** Laweciarz przyjmuje zlecenie – z portfela schodzi prowizja Holuj. */
export function acceptJob(id: string): boolean {
  const j = state.jobs.find((x) => x.id === id);
  if (!j) return false;
  const fee = platformFee(j.price.total);
  if (state.wallet.balance < fee) return false;
  set({
    ...state,
    wallet: { balance: state.wallet.balance - fee, txs: [{ at: Date.now(), amount: -fee, label: `Prowizja – zlecenie ${id}` }, ...state.wallet.txs] },
    jobs: state.jobs.map((x) => (x.id === id ? { ...x, fee, status: "przyjete", events: [...x.events, { status: "przyjete", at: Date.now() }] } : x)),
  });
  return true;
}

/** Anulowanie przez laweciarza po przyjęciu: kara + spadek oceny, prowizja nie wraca. */
export function driverCancel(id: string) {
  set({
    ...state,
    me: { ...state.me, rating: Math.max(1, +(state.me.rating - 0.3).toFixed(1)) },
    wallet: { balance: state.wallet.balance - CANCEL_PENALTY, txs: [{ at: Date.now(), amount: -CANCEL_PENALTY, label: `Kara za anulowanie ${id}` }, ...state.wallet.txs] },
    jobs: state.jobs.map((x) => (x.id === id ? { ...x, status: "anulowane", events: [...x.events, { status: "anulowane", at: Date.now() }] } : x)),
  });
}

export function sendMessage(id: string, from: ChatMessage["from"], text: string) {
  if (!text.trim()) return;
  set({ ...state, jobs: state.jobs.map((x) => (x.id === id ? { ...x, messages: [...x.messages, { from, text: text.trim(), at: Date.now() }] } : x)) });
}

/** Demo: część lawet jest zajęta innym zleceniem. */
export function busyFreeInMin(d: Driver, now: number): number | null {
  if (d.id === ME_ID) return null;
  if (d.id === "d2" || d.id === "d7") return 8 + ((Math.floor(now / 60000) + parseInt(d.id.slice(1), 10)) % 15);
  return null;
}

/* ---------- Symulacja (demo) ----------
 * Mockowi kierowcy sami akceptują i jadą. Czas skrócony: 1 min realnej jazdy = 1 s demo (min 8 s).
 */
const DEMO_SEC_PER_MIN = 1;
const travelMs = (km: number) => Math.max(8, etaMin(km) * DEMO_SEC_PER_MIN) * 1000;

function lastAt(j: Job, s: JobStatus) {
  return [...j.events].reverse().find((e) => e.status === s)?.at;
}

export function tick() {
  const now = Date.now();
  let changed = false;
  const drivers = allDrivers();
  const jobs = state.jobs.map((j) => {
    const d = drivers.find((x) => x.id === j.driverId);
    if (!d) return j;
    const start = livePos(d, j.createdAt);
    let next = j;
    const go = (status: JobStatus) => {
      next = { ...next, status, events: [...next.events, { status, at: now }] };
      changed = true;
    };

    if (d.id !== ME_ID) {
      const since = now - (j.events.at(-1)?.at ?? j.createdAt);
      if (j.status === "szukanie" && since > 3500) {
        go("przyjete");
        next = { ...next, fee: platformFee(j.price.total), messages: [...next.messages, { from: "driver", text: `Dzień dobry, przyjąłem zlecenie. Wyjeżdżam, będę ok. ${etaMin(roadKm(start, j.pickup))} min.`, at: now }] };
      }
      else if (j.status === "przyjete" && since > 2500) go("w_drodze");
      else if (j.status === "w_drodze" && since > travelMs(roadKm(start, j.pickup))) go("na_miejscu");
      else if (j.status === "na_miejscu" && since > 5000) go("zaladunek");
      else if (j.status === "zaladunek" && since > 5000) go("w_transporcie");
      else if (j.status === "w_transporcie" && since > travelMs(roadKm(j.pickup, j.dropoff))) go("dostarczone");
    }

    // demo: mockowy operator odpisuje na wiadomość klienta
    if (d.id !== ME_ID) {
      const last = next.messages.at(-1);
      if (last && last.from === "client" && now - last.at > 2500) {
        next = { ...next, messages: [...next.messages, { from: "driver", text: "Jasne, przyjąłem. Proszę czekać w bezpiecznym miejscu, za barierką.", at: now }] };
        changed = true;
      }
    }

    // pozycja lawety
    let pos = next.truckPos;
    if (next.status === "w_drodze") {
      const t0 = lastAt(next, "w_drodze") ?? now;
      const t = Math.min(1, (now - t0) / travelMs(roadKm(start, next.pickup)));
      pos = lerp(start, next.pickup, t);
    } else if (["na_miejscu", "zaladunek"].includes(next.status)) pos = next.pickup;
    else if (next.status === "w_transporcie") {
      const t0 = lastAt(next, "w_transporcie") ?? now;
      const t = Math.min(1, (now - t0) / travelMs(roadKm(next.pickup, next.dropoff)));
      pos = lerp(next.pickup, next.dropoff, t);
    } else if (next.status === "dostarczone") pos = next.dropoff;
    if (pos.lat !== next.truckPos.lat || pos.lng !== next.truckPos.lng) {
      next = { ...next, truckPos: pos };
      changed = true;
    }
    return next;
  });
  if (changed) set({ ...state, jobs });
}

/** Pozostały czas dojazdu (min, w skali „realnej”) dla widoku klienta. */
export function remainingMin(j: Job): number {
  if (j.status === "w_transporcie") return etaMin(roadKm(j.truckPos, j.dropoff));
  return etaMin(roadKm(j.truckPos, j.pickup));
}
