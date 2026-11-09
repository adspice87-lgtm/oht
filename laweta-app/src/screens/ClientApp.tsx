import { ArrowLeft, Check, ChevronRight, Clock, Lock, MapPin, MessageCircle, Navigation, Search, ShieldCheck, Truck, X } from "lucide-react";
import Chat from "../components/Chat";
import { useEffect, useMemo, useState } from "react";
import MapView, { meIcon, pinIcon, truckIcon, type MapMarker } from "../components/MapView";
import { Rating, Sheet, Stepper, Toggle, Verified, zl } from "../components/ui";
import { ME_ID } from "../lib/mock";
import { CATEGORIES, CLIENT_STATUS, PLACES, SITUATIONS, SLOGAN } from "../lib/copy";
import { etaMin, reverseGeocode, roadKm, searchAddress, WARSAW, type LatLng, type Place } from "../lib/geo";
import { quote, TRUCK_LABEL, truckFits } from "../lib/pricing";
import { allDrivers, busyFreeInMin, clearActive, createJob, livePos, patchJob, remainingMin, setStatus, useStore } from "../lib/store";
import type { Driver, Job, PriceBreakdown, VehicleInfo } from "../lib/types";

type Step = "home" | "where" | "vehicle" | "offers" | "confirm" | "track";

const PRESETS: Place[] = [
  { label: "Warsztat Auto-Serwis, ul. Grochowska 21", lat: 52.2432, lng: 21.0838 },
  { label: "ASO Toyota, al. Krakowska 61", lat: 52.1852, lng: 20.9576 },
  { label: "Dom – ul. Puławska 145", lat: 52.1871, lng: 21.0215 },
];

const DEFAULT_VEHICLE: VehicleInfo = {
  category: "osobowy",
  situation: "nie_odpala",
  rolls: true,
  steering: true,
  lowered: false,
  electric: false,
  awd: false,
  placeKind: "ulica",
  passengers: 1,
  keys: true,
  makeModel: "",
  note: "",
};

type Offer = { driver: Driver; pos: LatLng; price: PriceBreakdown; eta: number; freeIn: number | null };

export default function ClientApp({ dark, now }: { dark: boolean; now: number }) {
  const me = useStore((s) => s.me);
  const jobs = useStore((s) => s.jobs);
  const activeJobId = useStore((s) => s.activeJobId);
  const activeJob = jobs.find((j) => j.id === activeJobId) ?? null;

  const [step, setStep] = useState<Step>(activeJob ? "track" : "home");
  const [pickup, setPickup] = useState<Place>({ ...WARSAW, label: "Ustalanie lokalizacji…" });
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo>(DEFAULT_VEHICLE);
  const [chosen, setChosen] = useState<Offer | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [gpsDenied, setGpsDenied] = useState(false);

  // geolokalizacja klienta
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        // demo: jeśli jesteś daleko od Warszawy (brak mockowych lawet) – zostajemy w Warszawie
        if (roadKm(pos, WARSAW) > 60) return setPickup({ ...WARSAW, label: "Centrum Warszawy (demo)" });
        setPickup({ ...pos, label: await reverseGeocode(pos) });
      },
      () => {
        setGpsDenied(true);
        setPickup({ ...WARSAW, label: "Centrum Warszawy (demo)" });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (activeJob && step !== "track") setStep("track");
  }, [activeJob, step]);

  const drivers = useMemo(() => allDrivers({ me }), [me]);
  const busy = new Set(jobs.filter((j) => !["dostarczone", "anulowane"].includes(j.status)).map((j) => j.driverId));
  const online = drivers.filter((d) => d.online);
  const freeInOf = (d: Driver) => (busy.has(d.id) ? 20 : busyFreeInMin(d, now));
  const freeCount = online.filter((d) => freeInOf(d) === null).length;

  const offers: Offer[] = useMemo(() => {
    if (!dropoff) return [];
    return online
      .filter((d) => truckFits(d, vehicle))
      .map((d) => {
        const pos = livePos(d, now);
        return { driver: d, pos, price: quote(d.pricing, pos, pickup, dropoff, vehicle), eta: etaMin(roadKm(pos, pickup)), freeIn: freeInOf(d) };
      })
      .sort((a, b) => (a.freeIn === null ? 0 : 1) - (b.freeIn === null ? 0 : 1) || a.eta - b.eta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropoff, vehicle, pickup, online.length, Math.floor(now / 5000)]);

  const available = offers.filter((o) => o.freeIn === null);
  const cheapest = available.length ? Math.min(...available.map((o) => o.price.total)) : 0;

  /* ---------- mapa ---------- */
  const markers: MapMarker[] = [];
  let fit: LatLng[] = [];
  let route: LatLng[] | undefined;
  if (step === "track" && activeJob) {
    markers.push({ id: "p", pos: activeJob.pickup, icon: pinIcon("#0E1A2B", "A") });
    markers.push({ id: "d", pos: activeJob.dropoff, icon: pinIcon("#1DB954", "B") });
    markers.push({ id: "t", pos: activeJob.truckPos, icon: truckIcon("#FF7A00", true) });
    route = activeJob.status === "w_transporcie" ? [activeJob.truckPos, activeJob.dropoff] : [activeJob.truckPos, activeJob.pickup];
    fit = [activeJob.truckPos, activeJob.status === "w_transporcie" || activeJob.status === "dostarczone" ? activeJob.dropoff : activeJob.pickup];
  } else {
    markers.push({ id: "you", pos: pickup, icon: meIcon, label: "Tu jesteś" });
    if (dropoff) markers.push({ id: "d", pos: dropoff, icon: pinIcon("#1DB954", "B"), label: dropoff.label });
    const list = step === "offers" ? offers.map((o) => ({ d: o.driver, pos: o.pos })) : online.map((d) => ({ d, pos: livePos(d, now) }));
    list.forEach(({ d, pos }) =>
      markers.push({
        id: d.id,
        pos,
        icon: truckIcon(chosen?.driver.id === d.id ? "#1DB954" : freeInOf(d) === null ? "#FF7A00" : "#8A97A8"),
        label: `${TRUCK_LABEL[d.truck]} · ${freeInOf(d) === null ? "wolna" : "zajęta"}`,
        onClick: step === "offers" && freeInOf(d) === null ? () => setChosen(offers.find((o) => o.driver.id === d.id) ?? null) : undefined,
      }),
    );
    fit = step === "offers" && offers.length ? [pickup, ...offers.slice(0, 3).map((o) => o.pos)] : dropoff && step !== "home" ? [pickup, dropoff] : [pickup];
    if (dropoff && step !== "home") route = [pickup, dropoff];
  }

  const onMapClick = async (p: LatLng) => {
    if (step === "home") setPickup({ ...p, label: await reverseGeocode(p) });
    if (step === "where") setDropoff({ ...p, label: await reverseGeocode(p) });
  };

  const order = () => {
    if (!chosen || !dropoff) return;
    const job: Job = {
      id: `Z-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
      pickup,
      dropoff,
      vehicle,
      phone,
      clientName: name || "Klient",
      driverId: chosen.driver.id,
      price: chosen.price,
      status: "szukanie",
      events: [{ status: "szukanie", at: Date.now() }],
      truckPos: chosen.pos,
      messages: note.trim() ? [{ from: "client", text: note.trim(), at: Date.now() }] : [],
    };
    createJob(job);
    setStep("track");
  };

  const reset = () => {
    clearActive();
    setChosen(null);
    setDropoff(null);
    setVehicle(DEFAULT_VEHICLE);
    setStep("home");
  };

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView center={pickup} markers={markers} fit={fit} route={route} onMapClick={onMapClick} dark={dark} />
      </div>

      {step !== "home" && step !== "track" && (
        <button
          onClick={() => setStep(step === "where" ? "home" : step === "vehicle" ? "where" : step === "offers" ? "vehicle" : "offers")}
          className="absolute left-4 top-4 z-[500] grid h-12 w-12 place-items-center rounded-full bg-white shadow-card dark:bg-ink-2"
          aria-label="Wstecz"
        >
          <ArrowLeft />
        </button>
      )}

      {/* HOME */}
      {step === "home" && (
        <Sheet>
          <p className="label">{SLOGAN}</p>
          <h1 className="mt-1 text-2xl font-extrabold">Gdzie jesteś?</h1>
          <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-white p-3 dark:bg-ink-2">
            <Navigation className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{pickup.label}</div>
              <div className="text-xs text-muted">{gpsDenied ? "Nie widzimy Twojej lokalizacji – stuknij na mapie" : "Stuknij mapę, aby poprawić miejsce"}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
            {freeCount} wolnych lawet w okolicy teraz
          </div>
          <button className="btn-primary mt-4 w-full text-xl" onClick={() => setStep("where")}>
            <Truck /> Potrzebuję lawety
          </button>
          <div className="mt-3 flex justify-between text-sm">
            <a href="tel:112" className="font-semibold text-bad">
              Wypadek z rannymi? Dzwoń 112
            </a>
            <span className="text-muted">Kontakt z laweciarzem tylko w aplikacji</span>
          </div>
        </Sheet>
      )}

      {/* GDZIE */}
      {step === "where" && (
        <Sheet>
          <Stepper step={0} total={3} />
          <h2 className="mt-3 text-xl font-extrabold">Dokąd holujemy?</h2>
          <div className="mt-3 rounded-[14px] bg-white p-3 text-sm dark:bg-ink-2">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-bold text-white dark:bg-white dark:text-ink">A</span>
              <span className="truncate">{pickup.label}</span>
            </div>
            <div className="ml-3 h-4 border-l-2 border-dashed border-slate-300" />
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ok text-xs font-bold text-white">B</span>
              <span className={`truncate ${dropoff ? "" : "text-muted"}`}>{dropoff?.label ?? "Wybierz cel poniżej lub stuknij mapę"}</span>
            </div>
          </div>
          <AddressSearch near={pickup} onPick={setDropoff} />
          <div className="mt-2 space-y-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setDropoff(p)} className={`chip flex w-full items-center gap-2 ${dropoff?.label === p.label ? "chip-on" : ""}`}>
                <MapPin className="h-4 w-4 shrink-0 text-muted" /> <span className="truncate text-sm">{p.label}</span>
              </button>
            ))}
          </div>
          <button className="btn-primary mt-4 w-full" disabled={!dropoff} onClick={() => setStep("vehicle")}>
            Dalej <ChevronRight />
          </button>
        </Sheet>
      )}

      {/* POJAZD */}
      {step === "vehicle" && (
        <Sheet>
          <Stepper step={1} total={3} />
          <h2 className="mt-3 text-xl font-extrabold">Co się stało?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SITUATIONS.map((s) => (
              <button key={s.id} className={`chip ${vehicle.situation === s.id ? "chip-on" : ""}`} onClick={() => setVehicle({ ...vehicle, situation: s.id })}>
                <span className="mr-1">{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
          <p className="label mt-4">Pojazd</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`chip ${vehicle.category === c.id ? "chip-on" : ""}`} onClick={() => setVehicle({ ...vehicle, category: c.id })}>
                {c.label}
                <div className="text-xs font-normal text-muted">{c.hint}</div>
              </button>
            ))}
          </div>
          <p className="label mt-4">Gdzie stoi auto?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLACES.map((p) => (
              <button key={p.id} className={`chip py-2 text-sm ${vehicle.placeKind === p.id ? "chip-on" : ""}`} onClick={() => setVehicle({ ...vehicle, placeKind: p.id })}>
                {p.label}
              </button>
            ))}
          </div>
          {vehicle.placeKind === "parking_podziemny" && (
            <input className="input mt-2" type="number" placeholder="Wysokość wjazdu do garażu (cm)" onChange={(e) => setVehicle({ ...vehicle, garageHeightCm: +e.target.value })} />
          )}
          <div className="card mt-4 divide-y divide-slate-100 px-4 dark:divide-ink-3">
            <Toggle label="Koła się kręcą (da się przetoczyć)" on={vehicle.rolls} onChange={(rolls) => setVehicle({ ...vehicle, rolls })} />
            <Toggle label="Kierownica się kręci" on={vehicle.steering} onChange={(steering) => setVehicle({ ...vehicle, steering })} />
            <Toggle label="Elektryk / hybryda" on={vehicle.electric} onChange={(electric) => setVehicle({ ...vehicle, electric })} />
            <Toggle label="4x4 / AWD / automat" on={vehicle.awd} onChange={(awd) => setVehicle({ ...vehicle, awd })} />
            <Toggle label="Auto obniżone / sportowe" on={vehicle.lowered} onChange={(lowered) => setVehicle({ ...vehicle, lowered })} />
            <Toggle label="Mam kluczyki" on={vehicle.keys} onChange={(keys) => setVehicle({ ...vehicle, keys })} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[14px] bg-white p-3 dark:bg-ink-2">
            <span className="font-medium">Pasażerowie do zabrania</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((n) => (
                <button key={n} onClick={() => setVehicle({ ...vehicle, passengers: n })} className={`h-10 w-10 rounded-xl font-bold ${vehicle.passengers === n ? "bg-brand text-ink" : "bg-paper dark:bg-ink-3"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <input className="input mt-3" placeholder="Marka i model (np. Skoda Octavia)" value={vehicle.makeModel} onChange={(e) => setVehicle({ ...vehicle, makeModel: e.target.value })} />
          <button className="btn-primary mt-4 w-full" onClick={() => setStep("offers")}>
            Pokaż lawety i ceny <ChevronRight />
          </button>
        </Sheet>
      )}

      {/* OFERTY */}
      {step === "offers" && (
        <Sheet>
          <Stepper step={2} total={3} />
          <div className="mt-3 flex items-end justify-between">
            <h2 className="text-xl font-extrabold">Lawety w pobliżu</h2>
            <span className="text-xs text-muted">{offers[0] ? `${offers[0].price.loadedKm.toFixed(1)} km trasy` : ""}</span>
          </div>
          <p className="text-sm text-muted">Zaznacz wolną lawetę – zlecenie trafi do operatora w aplikacji. Cena całkowita, bez niespodzianek.</p>
          {offers.length === 0 && (
            <div className="card mt-3 p-4 text-center">
              <p className="font-semibold">Szukamy dalej… Na razie nikt nie jest wolny w pobliżu.</p>
            </div>
          )}
          <div className="mt-3 space-y-2">
            {offers.map((o, i) => {
              const free = o.freeIn === null;
              return (
                <button key={o.driver.id} disabled={!free} onClick={() => setChosen(o)} className={`chip w-full disabled:opacity-55 ${chosen?.driver.id === o.driver.id ? "chip-on" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${free ? "bg-brand text-ink" : "bg-slate-200 text-muted dark:bg-ink-3"}`}>
                      <Truck />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {free ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold text-ok">
                            <span className="h-1.5 w-1.5 rounded-full bg-ok" /> WOLNA
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-muted dark:bg-ink-3">ZAJĘTA · wolna za ~{o.freeIn} min</span>
                        )}
                        {free && i === 0 && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-ink">NAJSZYBCIEJ</span>}
                        {free && o.price.total === cheapest && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-ink">NAJTANIEJ</span>}
                      </div>
                      <div className="mt-1 font-bold">{TRUCK_LABEL[o.driver.truck]}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span>z operatorem · {o.driver.id === ME_ID ? "Ty (demo)" : o.driver.name}</span>
                        <Rating value={o.driver.rating} jobs={o.driver.jobs} />
                        <span>do {(o.driver.maxKg / 1000).toLocaleString("pl-PL")} t</span>
                        {o.driver.verified && <Verified />}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xl font-extrabold">{zl(o.price.total)}</div>
                      <div className="flex items-center justify-end gap-1 text-sm font-semibold text-brand-dark">
                        <Clock className="h-4 w-4" /> {o.eta} min
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {chosen && (
            <details className="mt-3 rounded-[14px] bg-white p-3 text-sm dark:bg-ink-2">
              <summary className="cursor-pointer font-semibold">Z czego składa się cena?</summary>
              <ul className="mt-2 space-y-1">
                {chosen.price.items.map((it) => (
                  <li key={it.label} className="flex justify-between gap-2">
                    <span className="text-muted">{it.label}</span>
                    <span className="font-semibold">{zl(it.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Postój powyżej 15 min: {zl(chosen.driver.pricing.waitRate15)} / 15 min. Płatność u kierowcy (gotówka / karta / BLIK).</p>
            </details>
          )}
          <div className="sticky -bottom-6 -mx-4 mt-3 bg-paper px-4 pb-6 pt-2 dark:bg-ink">
            <button className="btn-primary w-full" disabled={!chosen} onClick={() => setStep("confirm")}>
              {chosen ? `Wyślij zlecenie · ${zl(chosen.price.total)}` : "Zaznacz wolną lawetę"}
            </button>
          </div>
        </Sheet>
      )}

      {/* POTWIERDZENIE */}
      {step === "confirm" && chosen && (
        <Sheet>
          <h2 className="text-xl font-extrabold">Ostatni krok</h2>
          <p className="text-sm text-muted">Bez zakładania konta. Numer służy do potwierdzenia (SMS) – laweciarz go nie widzi. Kontakt w aplikacji.</p>
          <input className="input mt-3 text-lg" type="tel" inputMode="tel" placeholder="Twój numer telefonu" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="input mt-2" placeholder="Imię (opcjonalnie)" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="input mt-2" rows={2} placeholder="Wiadomość do operatora, np. „stoję przy stacji Orlen, srebrna Octavia”" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="card mt-3 p-4">
            <div className="flex justify-between">
              <span className="font-semibold">{TRUCK_LABEL[chosen.driver.truck]}</span>
              <span className="text-xl font-extrabold">{zl(chosen.price.total)}</span>
            </div>
            <div className="mt-1 text-sm text-muted">
              Dojazd ok. {chosen.eta} min · operator {chosen.driver.id === ME_ID ? "Ty (demo)" : chosen.driver.name} · ★ {chosen.driver.rating.toFixed(1)}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-ok/10 p-3 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-ok" />
              <span>
                <b>Cena zablokowana.</b> Kierowca nie może jej podnieść na miejscu, chyba że dane w zgłoszeniu były nieprawdziwe – wtedy zmianę musisz zaakceptować w aplikacji.
              </span>
            </div>
          </div>
          <button className="btn-primary mt-4 w-full" disabled={phone.replace(/\D/g, "").length < 9} onClick={order}>
            <MessageCircle /> Wyślij zlecenie do laweciarza
          </button>
          <p className="mt-2 text-center text-xs text-muted">W wersji produkcyjnej: kod SMS (OTP) do potwierdzenia numeru.</p>
        </Sheet>
      )}

      {/* ŚLEDZENIE */}
      {step === "track" && activeJob && <Tracking job={activeJob} driver={drivers.find((d) => d.id === activeJob.driverId)!} onDone={reset} />}
    </div>
  );
}

function AddressSearch({ near, onPick }: { near: LatLng; onPick: (p: Place) => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Place[]>([]);
  useEffect(() => {
    const t = setTimeout(async () => setRes(await searchAddress(q, near)), 450);
    return () => clearTimeout(t);
  }, [q, near]);
  return (
    <div className="relative mt-3">
      <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted" />
      <input className="input pl-10" placeholder="Wpisz adres warsztatu / domu" value={q} onChange={(e) => setQ(e.target.value)} />
      {res.length > 0 && (
        <div className="card absolute inset-x-0 top-full z-10 mt-1 overflow-hidden">
          {res.map((r) => (
            <button
              key={`${r.lat}${r.lng}`}
              className="block w-full px-4 py-3 text-left text-sm hover:bg-paper dark:hover:bg-ink-3"
              onClick={() => {
                onPick(r);
                setRes([]);
                setQ(r.label);
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FLOW = ["szukanie", "przyjete", "w_drodze", "na_miejscu", "zaladunek", "w_transporcie", "dostarczone"] as const;

function Tracking({ job, driver, onDone }: { job: Job; driver: Driver; onDone: () => void }) {
  const eta = remainingMin(job);
  const idx = FLOW.indexOf(job.status as (typeof FLOW)[number]);
  const [stars, setStars] = useState(job.rating ?? 0);

  if (job.status === "dostarczone" || job.status === "anulowane") {
    return (
      <Sheet>
        <div className="text-center">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${job.status === "anulowane" ? "bg-bad" : "bg-ok"} text-white`}>
            {job.status === "anulowane" ? <X className="h-8 w-8" /> : <Check className="h-8 w-8" />}
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">{job.status === "anulowane" ? "Zlecenie anulowane" : `Gotowe. Do zapłaty: ${zl(job.price.total)}`}</h2>
          {job.status === "dostarczone" && (
            <>
              <p className="mt-1 text-muted">Jak oceniasz operatora{driver.id === ME_ID ? "" : ` (${driver.name})`}?</p>
              <div className="mt-3 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setStars(n);
                      patchJob(job.id, { rating: n });
                    }}
                    className={`text-4xl ${n <= stars ? "text-brand" : "text-slate-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn-dark mt-5 w-full" onClick={onDone}>
            Zamknij
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <p className="label">Zlecenie {job.id}</p>
      <h2 className="mt-1 text-2xl font-extrabold">{CLIENT_STATUS[job.status](eta, TRUCK_LABEL[driver.truck])}</h2>
      <div className="mt-3 flex gap-1">
        {FLOW.slice(1).map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-brand" : "bg-slate-200 dark:bg-ink-3"}`} />
        ))}
      </div>
      <div className="card mt-4 flex items-center gap-3 p-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-ink">
          <Truck />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{TRUCK_LABEL[driver.truck]}</div>
          <div className="text-sm text-muted">
            {driver.id === ME_ID ? "Ty (demo)" : driver.name} · {driver.plate} · <Rating value={driver.rating} />
          </div>
        </div>
        <div className="text-right text-lg font-extrabold">{zl(job.price.total)}</div>
      </div>
      <div className="mt-3">
        <Chat job={job} as="client" />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" /> Numery telefonów ukryte
        </span>
        <button className="font-semibold text-bad disabled:opacity-40" disabled={idx >= 3} onClick={() => setStatus(job.id, "anulowane")}>
          Anuluj zlecenie
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Przed załadunkiem kierowca zrobi zdjęcia auta (protokół). Płatność u kierowcy po dostarczeniu.</p>
    </Sheet>
  );
}
