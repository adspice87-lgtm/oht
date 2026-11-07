import { useSyncExternalStore } from "react";
import { etaMin, lerp, roadKm } from "./geo";
import { ME_DRIVER_DEFAULT, ME_ID, MOCK_DRIVERS } from "./mock";
import type { Driver, Job, JobStatus } from "./types";

/**
 * Prosty store MVP: localStorage + BroadcastChannel (synchronizacja między kartami).
 * Otwórz klienta w jednej karcie i laweciarza w drugiej – zlecenia przechodzą na żywo.
 * W wersji produkcyjnej zastępujemy to Supabase (tabele jobs/driver_locations + Realtime).
 */
type State = { me: Driver; jobs: Job[]; activeJobId: string | null };

const KEY = "laweta-mvp-v1";
const chan = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(KEY) : null;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* ignore */
  }
  return { me: ME_DRIVER_DEFAULT, jobs: [], activeJobId: null };
}

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

export function allDrivers(s: State = state): Driver[] {
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
  set({ me: ME_DRIVER_DEFAULT, jobs: [], activeJobId: null });
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
      if (j.status === "szukanie" && since > 3500) go("przyjete");
      else if (j.status === "przyjete" && since > 2500) go("w_drodze");
      else if (j.status === "w_drodze" && since > travelMs(roadKm(start, j.pickup))) go("na_miejscu");
      else if (j.status === "na_miejscu" && since > 5000) go("zaladunek");
      else if (j.status === "zaladunek" && since > 5000) go("w_transporcie");
      else if (j.status === "w_transporcie" && since > travelMs(roadKm(j.pickup, j.dropoff))) go("dostarczone");
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
