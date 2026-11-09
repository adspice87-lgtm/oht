import { AlertTriangle, Camera, Check, Clock, MapPin, Navigation, Plus, Power, Settings2, Truck, Wallet, X } from "lucide-react";
import Chat from "../components/Chat";
import { CANCEL_PENALTY, FEE_MIN, FEE_PCT, platformFee, TOPUPS } from "../lib/fees";
import { useEffect, useMemo, useState } from "react";
import MapView, { pinIcon, truckIcon, type MapMarker } from "../components/MapView";
import { Toggle, zl } from "../components/ui";
import { CATEGORIES, DRIVER_NEXT, PLACES, SITUATIONS, STATUS_SHORT } from "../lib/copy";
import { etaMin, roadKm, type LatLng } from "../lib/geo";
import { DEFAULT_PRICING, quote, TRUCK_LABEL } from "../lib/pricing";
import { ME_ID, MOCK_DRIVERS } from "../lib/mock";
import { acceptJob, addJob, driverCancel, getState, patchJob, setStatus, topUp, updateMe, useStore } from "../lib/store";
import type { Job, Pricing, TruckType, VehicleInfo } from "../lib/types";

type Tab = "duty" | "pricing" | "history";
const OFFER_SECONDS = 30;

export default function DriverApp({ dark }: { dark: boolean }) {
  const me = useStore((s) => s.me);
  const jobs = useStore((s) => s.jobs);
  const [tab, setTab] = useState<Tab>("duty");
  const isDriver = useStore((s) => s.isDriver);

  const mine = jobs.filter((j) => j.driverId === ME_ID);
  const offer = mine.find((j) => j.status === "szukanie");
  const active = mine.find((j) => !["szukanie", "dostarczone", "anulowane"].includes(j.status));
  const today = mine.filter((j) => j.status === "dostarczone" && new Date(j.createdAt).toDateString() === new Date().toDateString());

  // pozycja laweciarza z GPS (tylko gdy online)
  useEffect(() => {
    if (!me.online || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (roadKm(pos, { lat: 52.2297, lng: 21.0122 }) < 60) updateMe({ pos });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [me.online]);

  if (!isDriver)
    return (
      <div className="grid h-full place-items-center bg-paper p-6 text-center dark:bg-ink">
        <div>
          <Truck className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-2 font-bold">Nie jesteś jeszcze laweciarzem</p>
          <p className="text-sm text-muted">Ustawienia (⚙️) → „Zostań laweciarzem”</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col bg-paper dark:bg-ink">
      <div className="flex-1 overflow-y-auto">
        {offer ? (
          <IncomingOffer job={offer} />
        ) : active ? (
          <ActiveJob job={active} dark={dark} />
        ) : tab === "duty" ? (
          <Duty todayCount={today.length} todaySum={today.reduce((s, j) => s + j.price.total, 0)} dark={dark} />
        ) : tab === "pricing" ? (
          <PricingEditor pricing={me.pricing} truck={me.truck} maxKg={me.maxKg} company={me.company} />
        ) : (
          <History jobs={mine} />
        )}
      </div>
      {!offer && !active && (
        <nav className="grid grid-cols-3 border-t border-slate-200 bg-white dark:border-ink-3 dark:bg-ink-2">
          {(
            [
              ["duty", "Dyżur", Power],
              ["pricing", "Cennik", Settings2],
              ["history", "Portfel", Wallet],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex flex-col items-center gap-1 py-3 text-xs font-bold ${tab === id ? "text-brand-dark" : "text-muted"}`}>
              <Icon className="h-6 w-6" /> {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function Duty({ todayCount, todaySum, dark }: { todayCount: number; todaySum: number; dark: boolean }) {
  const me = useStore((s) => s.me);
  return (
    <div className="flex h-full flex-col">
      <div className="relative h-56 shrink-0">
        <MapView center={me.pos} markers={[{ id: "me", pos: me.pos, icon: truckIcon(me.online ? "#FD6701" : "#8A97A8", true) }]} fit={[me.pos]} dark={dark} />
      </div>
      <div className="space-y-4 p-4">
        <button
          onClick={() => updateMe({ online: !me.online })}
          className={`btn min-h-[88px] w-full text-2xl ${me.online ? "bg-ok text-white" : "bg-ink text-white dark:bg-white dark:text-ink"}`}
        >
          <Power className="h-8 w-8" />
          {me.online ? "JESTEM DOSTĘPNY" : "Zacznij dyżur"}
        </button>
        <p className="text-center text-sm text-muted">
          {me.online ? "Jesteś dostępny. Damy znać, gdy pojawi się zlecenie." : "Klienci nie widzą Cię na mapie. Lokalizacja nie jest wysyłana."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="label">Dziś zleceń</p>
            <p className="mt-1 text-3xl font-extrabold">{todayCount}</p>
          </div>
          <div className="card p-4">
            <p className="label">Dziś zarobek</p>
            <p className="mt-1 text-3xl font-extrabold">{zl(todaySum)}</p>
          </div>
        </div>
        <WalletStrip />
        <div className="card p-4 text-sm">
          <p className="font-bold">
            {me.company} · {me.plate}
          </p>
          <p className="text-muted">
            {TRUCK_LABEL[me.truck]} · start {zl(me.pricing.startFee)} · {me.pricing.perKmLoaded} zł/km
          </p>
        </div>
        {me.online && (
          <button className="btn-ghost w-full" onClick={simulateRequest}>
            🧪 Demo: wyślij mi testowe zlecenie
          </button>
        )}
        <p className="text-center text-xs text-muted">Wskazówka: przełącz się w Ustawieniach na tryb Klient (albo otwórz drugą kartę) i zaznacz swoją lawetę – „operator: Ty (demo)”.</p>
      </div>
    </div>
  );
}

function simulateRequest() {
  const { me } = getState();
  const rnd = (a: number) => (Math.random() - 0.5) * a;
  const pickup = { lat: me.pos.lat + rnd(0.05), lng: me.pos.lng + rnd(0.08), label: "ul. Marszałkowska 104, Warszawa" };
  const dropoff = { lat: me.pos.lat + rnd(0.12), lng: me.pos.lng + rnd(0.18), label: "Warsztat Auto-Serwis, ul. Grochowska 21" };
  const vehicle: VehicleInfo = {
    category: "osobowy", situation: "nie_odpala", rolls: Math.random() > 0.3, steering: true, lowered: false, electric: false, awd: false,
    placeKind: "ulica", passengers: 1, keys: true, makeModel: "Volkswagen Golf VII", note: "Stoję na awaryjnych przy przystanku",
  };
  const job: Job = {
    id: `Z-${Date.now().toString().slice(-6)}`, createdAt: Date.now(), pickup, dropoff, vehicle, phone: "+48 512 345 678", clientName: "Anna",
    driverId: ME_ID, price: quote(me.pricing, me.pos, pickup, dropoff, vehicle), status: "szukanie",
    events: [{ status: "szukanie", at: Date.now() }], truckPos: me.pos,
    messages: [{ from: "client", text: "Stoję na awaryjnych przy przystanku, srebrny Golf.", at: Date.now() }],
  };
  addJob(job);
}

function IncomingOffer({ job }: { job: Job }) {
  const [left, setLeft] = useState(OFFER_SECONDS - Math.floor((Date.now() - job.createdAt) / 1000));
  const me = useStore((s) => s.me);
  useEffect(() => {
    const t = setInterval(() => setLeft(OFFER_SECONDS - Math.floor((Date.now() - job.createdAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [job.createdAt]);
  const reject = () => {
    // przekazanie dalej: najbliższa inna wolna laweta
    const next = MOCK_DRIVERS.filter((d) => d.online && d.truck !== "ciezka").sort((a, b) => roadKm(a.pos, job.pickup) - roadKm(b.pos, job.pickup))[0];
    patchJob(job.id, { driverId: next.id, createdAt: Date.now(), events: [{ status: "szukanie", at: Date.now() }], truckPos: next.pos });
  };
  useEffect(() => {
    if (left <= 0) reject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0]);
  const v = job.vehicle;
  const approach = roadKm(me.pos, job.pickup);
  const balance = useStore((s) => s.wallet.balance);
  const fee = platformFee(job.price.total);
  const canPay = balance >= fee;
  return (
    <div className="flex min-h-full flex-col bg-ink p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-ink">NOWE ZLECENIE</span>
        <span className="flex items-center gap-1 text-2xl font-extrabold tabular-nums">
          <Clock /> {Math.max(0, left)} s
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-3">
        <div className="h-full bg-brand transition-all" style={{ width: `${(Math.max(0, left) / OFFER_SECONDS) * 100}%` }} />
      </div>
      <p className="mt-6 text-6xl font-extrabold">{zl(job.price.total)}</p>
      <p className="mt-1 text-base text-slate-300">
        Prowizja holuj! {zl(fee)} z portfela · <b className="text-white">zostaje Ci {zl(job.price.total - fee)}</b>
      </p>
      <p className="mt-1 text-lg text-slate-300">
        Dojazd {approach.toFixed(1)} km (~{etaMin(approach)} min) · trasa {job.price.loadedKm.toFixed(1)} km
      </p>
      <div className="mt-6 space-y-3 rounded-2xl bg-ink-2 p-4 text-lg">
        <div className="flex gap-3">
          <MapPin className="mt-1 shrink-0 text-brand" /> <span>{job.pickup.label}</span>
        </div>
        <div className="flex gap-3">
          <Navigation className="mt-1 shrink-0 text-ok" /> <span>{job.dropoff.label}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Tag>{SITUATIONS.find((s) => s.id === v.situation)?.label}</Tag>
        <Tag>{CATEGORIES.find((c) => c.id === v.category)?.label}</Tag>
        <Tag>{PLACES.find((p) => p.id === v.placeKind)?.label}</Tag>
        {v.makeModel && <Tag>{v.makeModel}</Tag>}
        <Tag warn={!v.rolls}>{v.rolls ? "Toczy się" : "Koła zablokowane"}</Tag>
        {v.electric && <Tag warn>Elektryk</Tag>}
        {v.awd && <Tag warn>4x4 / automat</Tag>}
        {v.lowered && <Tag warn>Obniżone</Tag>}
        {v.passengers > 0 && <Tag>Pasażerowie: {v.passengers}</Tag>}
      </div>
      {job.messages.length > 0 && <p className="mt-3 rounded-xl bg-brand-soft p-3 text-ink">💬 {job.messages[0].text}</p>}
      {!canPay && (
        <div className="mt-4 rounded-2xl bg-bad/20 p-3 text-sm">
          <p className="font-bold text-red-200">Za mało środków w portfelu ({zl(balance)}). Doładuj, aby przyjąć zlecenie.</p>
          <div className="mt-2 flex gap-2">
            {TOPUPS.map((a) => (
              <button key={a} onClick={() => topUp(a)} className="btn min-h-[44px] flex-1 bg-white text-ink">
                +{a} zł
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto grid grid-cols-3 gap-3 pt-6">
        <button onClick={reject} className="btn min-h-[80px] bg-ink-3 text-xl text-white">
          <X /> Nie
        </button>
        <button disabled={!canPay} onClick={() => acceptJob(job.id)} className="btn col-span-2 min-h-[80px] bg-brand text-2xl text-ink">
          <Check className="h-8 w-8" /> BIORĘ
        </button>
      </div>
    </div>
  );
}

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return <span className={`rounded-full px-3 py-1 font-semibold ${warn ? "bg-bad/20 text-red-300" : "bg-ink-3"}`}>{children}</span>;
}

function ActiveJob({ job, dark }: { job: Job; dark: boolean }) {
  const me = useStore((s) => s.me);
  const [photos, setPhotos] = useState(0);
  const next = DRIVER_NEXT[job.status];
  const goingToPickup = ["przyjete", "w_drodze"].includes(job.status);
  const target = goingToPickup ? job.pickup : job.dropoff;
  const needPhotos = job.status === "zaladunek" && photos < 4;
  const markers: MapMarker[] = [
    { id: "p", pos: job.pickup, icon: pinIcon("#141414", "A") },
    { id: "d", pos: job.dropoff, icon: pinIcon("#1DB954", "B") },
    { id: "t", pos: goingToPickup ? me.pos : job.truckPos, icon: truckIcon("#FD6701", true) },
  ];
  const from: LatLng = goingToPickup ? me.pos : job.pickup;

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative h-64 shrink-0">
        <MapView center={target} markers={markers} fit={[from, target]} route={[from, target]} dark={dark} />
        <div className="absolute left-3 top-3 z-[500] rounded-full bg-ink px-3 py-1.5 text-sm font-bold text-white">
          {job.id} · {STATUS_SHORT[job.status]}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="card p-4">
          <p className="label">{goingToPickup ? "Odbiór" : "Dowóz do"}</p>
          <p className="mt-1 text-xl font-bold">{target.label}</p>
          <p className="mt-1 text-sm text-muted">
            {job.clientName} · {job.vehicle.makeModel || CATEGORIES.find((c) => c.id === job.vehicle.category)?.label} · <b className="text-ink dark:text-white">{zl(job.price.total)}</b> (cena zablokowana)
          </p>
          {job.vehicle.note && <p className="mt-2 rounded-lg bg-brand-soft p-2 text-sm text-ink">💬 {job.vehicle.note}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a className="btn-dark min-h-[64px]" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`}>
            <Navigation /> Nawiguj
          </a>
          <a className="btn-ghost min-h-[64px] text-lg" href="#czat">
            💬 Klient
          </a>
        </div>
        <div id="czat">
          <Chat job={job} as="driver" />
        </div>
        {job.status === "zaladunek" && (
          <label className="card flex cursor-pointer items-center gap-3 p-4">
            <Camera className="h-8 w-8 text-brand-dark" />
            <div className="flex-1">
              <p className="font-bold">Protokół zdjęciowy ({photos}/4)</p>
              <p className="text-sm text-muted">4 rogi auta + licznik. Chroni Cię przed sporami o uszkodzenia.</p>
            </div>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => setPhotos((p) => Math.min(4, p + (e.target.files?.length || 0)))} />
            <button type="button" className="text-xs font-bold text-muted underline" onClick={(e) => { e.preventDefault(); setPhotos(4); }}>
              demo
            </button>
          </label>
        )}
        <div className="mt-auto space-y-2">
          {next && (
            <button className="btn min-h-[80px] w-full bg-brand text-2xl text-ink" disabled={needPhotos} onClick={() => setStatus(job.id, next.next)}>
              {needPhotos ? "Najpierw zrób 4 zdjęcia" : next.label}
            </button>
          )}
          {["przyjete", "w_drodze"].includes(job.status) && (
            <CancelButton id={job.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, suffix, step = 1 }: { label: string; value: number; onChange: (n: number) => void; suffix: string; step?: number }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input type="number" step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="input w-24 py-2 text-right font-bold" />
        <span className="w-10 text-sm text-muted">{suffix}</span>
      </span>
    </label>
  );
}

function PricingEditor({ pricing, truck, maxKg, company }: { pricing: Pricing; truck: TruckType; maxKg: number; company: string }) {
  const set = (patch: Partial<Pricing>) => updateMe({ pricing: { ...pricing, ...patch } });
  const example = useMemo(() => {
    const v: VehicleInfo = { category: "osobowy", situation: "awaria", rolls: true, steering: true, lowered: false, electric: false, awd: false, placeKind: "ulica", passengers: 0, keys: true, makeModel: "", note: "" };
    const a = { lat: 52.2297, lng: 21.0122 };
    // przykład: 8 km dojazdu, 15 km z autem, w dzień, w tygodniu
    const day = new Date();
    day.setHours(12);
    day.setDate(day.getDate() + ((8 - day.getDay()) % 7 || 0));
    const off = (km: number) => ({ lat: a.lat + km / 1.3 / 111, lng: a.lng });
    return quote(pricing, off(-8), a, off(15), v, day.getDay() % 6 === 0 ? new Date(2026, 10, 10, 12) : day);
  }, [pricing]);
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-2xl font-extrabold">Twój cennik</h2>
        <p className="text-sm text-muted">Klient widzi cenę z góry, liczoną z Twoich stawek. Bez prowizji w okresie startowym.</p>
      </div>
      <div className="card px-4 py-2">
        <label className="flex items-center justify-between py-2.5">
          <span className="text-sm font-medium">Firma</span>
          <input className="input w-48 py-2 text-right" value={company} onChange={(e) => updateMe({ company: e.target.value })} />
        </label>
        <label className="flex items-center justify-between py-2.5">
          <span className="text-sm font-medium">Typ lawety</span>
          <select className="input w-48 py-2" value={truck} onChange={(e) => updateMe({ truck: e.target.value as TruckType })}>
            {Object.entries(TRUCK_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <NumField label="Ładowność / max DMC" value={maxKg} onChange={(maxKg) => updateMe({ maxKg })} suffix="kg" step={100} />
      </div>
      <div className="card divide-y divide-slate-100 px-4 py-1 dark:divide-ink-3">
        <NumField label="Opłata startowa" value={pricing.startFee} onChange={(startFee) => set({ startFee })} suffix="zł" />
        <NumField label="Za km z autem" value={pricing.perKmLoaded} onChange={(perKmLoaded) => set({ perKmLoaded })} suffix="zł/km" step={0.5} />
        <NumField label="Dojazd gratis do" value={pricing.freeApproachKm} onChange={(freeApproachKm) => set({ freeApproachKm })} suffix="km" />
        <NumField label="Za km dojazdu ponad limit" value={pricing.perKmApproach} onChange={(perKmApproach) => set({ perKmApproach })} suffix="zł/km" step={0.5} />
        <NumField label="Cena minimalna" value={pricing.minPrice} onChange={(minPrice) => set({ minPrice })} suffix="zł" step={10} />
        <NumField label="Mnożnik nocny (22–6)" value={pricing.nightMult} onChange={(nightMult) => set({ nightMult })} suffix="×" step={0.1} />
        <NumField label="Mnożnik weekend" value={pricing.weekendMult} onChange={(weekendMult) => set({ weekendMult })} suffix="×" step={0.1} />
      </div>
      <div className="card divide-y divide-slate-100 px-4 py-1 dark:divide-ink-3">
        <p className="label pt-3">Dopłaty (doliczane automatycznie z formularza klienta)</p>
        <NumField label="Autostrada / S-ka" value={pricing.surHighway} onChange={(surHighway) => set({ surHighway })} suffix="zł" step={10} />
        <NumField label="Nie toczy się / nie skręca" value={pricing.surNotRolling} onChange={(surNotRolling) => set({ surNotRolling })} suffix="zł" step={10} />
        <NumField label="Garaż podziemny" value={pricing.surUnderground} onChange={(surUnderground) => set({ surUnderground })} suffix="zł" step={10} />
        <NumField label="SUV / bus" value={pricing.surSuvVan} onChange={(surSuvVan) => set({ surSuvVan })} suffix="zł" step={10} />
        <NumField label="Rów / teren (od)" value={pricing.surDitch} onChange={(surDitch) => set({ surDitch })} suffix="zł" step={10} />
        <NumField label="Postój / 15 min (po 15 min)" value={pricing.waitRate15} onChange={(waitRate15) => set({ waitRate15 })} suffix="zł" step={5} />
      </div>
      <div className="rounded-2xl bg-ink p-4 text-white">
        <p className="label text-slate-400">Podgląd: 8 km dojazdu + 15 km z autem, dzień</p>
        <p className="mt-1 text-4xl font-extrabold">{zl(example.total)}</p>
      </div>
      <Toggle label="Przywróć domyślne stawki" on={false} onChange={() => set(DEFAULT_PRICING)} />
    </div>
  );
}

function CancelButton({ id }: { id: string }) {
  const [ask, setAsk] = useState(false);
  if (!ask)
    return (
      <button className="w-full py-2 text-sm font-semibold text-muted" onClick={() => setAsk(true)}>
        Anuluj zlecenie
      </button>
    );
  return (
    <div className="rounded-2xl bg-bad/10 p-3 text-sm">
      <p className="flex items-center gap-2 font-bold text-bad">
        <AlertTriangle className="h-4 w-4" /> Kara {zl(CANCEL_PENALTY)}, prowizja nie wraca, ocena spada o 0,3.
      </p>
      <p className="mt-1 text-muted">Klient czeka na poboczu. Anuluj tylko w razie awarii lawety.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => setAsk(false)}>
          Wracam do zlecenia
        </button>
        <button className="btn min-h-[48px] bg-bad text-white" onClick={() => driverCancel(id)}>
          Anuluj mimo to
        </button>
      </div>
    </div>
  );
}

function WalletStrip() {
  const balance = useStore((s) => s.wallet.balance);
  const low = balance < FEE_MIN;
  return (
    <div className={`card flex items-center gap-3 p-4 ${low ? "ring-2 ring-bad" : ""}`}>
      <Wallet className={`h-7 w-7 ${low ? "text-bad" : "text-brand-dark"}`} />
      <div className="flex-1">
        <p className="label">Portfel</p>
        <p className="text-xl font-extrabold">{zl(balance)}</p>
        {low && <p className="text-xs font-semibold text-bad">Za mało na prowizję – nie przyjmiesz zlecenia.</p>}
      </div>
      <button className="btn-primary min-h-[44px] px-3 text-base" onClick={() => topUp(200)}>
        <Plus className="h-4 w-4" /> 200 zł
      </button>
    </div>
  );
}

function History({ jobs }: { jobs: Job[] }) {
  const wallet = useStore((s) => s.wallet);
  const done = jobs.filter((j) => j.status === "dostarczone");
  const gross = done.reduce((s, j) => s + j.price.total, 0);
  const fees = jobs.reduce((s, j) => s + (j.fee ?? 0), 0);
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-extrabold">Portfel</h2>
      <div className="rounded-2xl bg-ink p-5 text-white">
        <p className="label text-slate-400">Saldo na prowizje</p>
        <p className="mt-1 text-4xl font-extrabold">{zl(wallet.balance)}</p>
        <div className="mt-3 flex gap-2">
          {TOPUPS.map((a) => (
            <button key={a} onClick={() => topUp(a)} className="btn min-h-[44px] flex-1 bg-brand text-ink">
              +{a} zł
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Demo – w produkcji BLIK / Przelewy24.</p>
      </div>
      <div className="card p-4 text-sm">
        <p className="font-bold">Jak to działa</p>
        <p className="mt-1 text-muted">
          Klient płaci Tobie całą kwotę. Za każde przyjęte zlecenie z portfela schodzi {FEE_PCT}% (min. {zl(FEE_MIN)}). Anulowanie po przyjęciu: kara {zl(CANCEL_PENALTY)}. Bez kliknięć w Google Ads, bez abonamentu.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label">Zarobione</p>
          <p className="mt-1 text-2xl font-extrabold">{zl(gross)}</p>
          <p className="text-xs text-muted">{done.length} zleceń</p>
        </div>
        <div className="card p-4">
          <p className="label">Prowizje</p>
          <p className="mt-1 text-2xl font-extrabold">{zl(fees)}</p>
          <p className="text-xs text-muted">na rękę {zl(gross - fees)}</p>
        </div>
      </div>
      <p className="label">Historia portfela</p>
      {wallet.txs.length === 0 && <p className="text-center text-muted">Brak operacji.</p>}
      {wallet.txs.map((t, i) => (
        <div key={i} className="card flex items-center justify-between p-3 text-sm">
          <div>
            <p className="font-semibold">{t.label}</p>
            <p className="text-xs text-muted">{new Date(t.at).toLocaleString("pl-PL")}</p>
          </div>
          <p className={`font-extrabold ${t.amount < 0 ? "text-bad" : "text-ok"}`}>
            {t.amount > 0 ? "+" : ""}
            {zl(t.amount)}
          </p>
        </div>
      ))}
      <p className="label">Zlecenia</p>
      {jobs.map((j) => (
        <div key={j.id} className="card flex items-center gap-3 p-4">
          <Truck className="h-6 w-6 shrink-0 text-brand-dark" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{j.dropoff.label}</p>
            <p className="text-xs text-muted">
              {new Date(j.createdAt).toLocaleString("pl-PL")} · {STATUS_SHORT[j.status]}
              {j.rating ? ` · ★ ${j.rating}` : ""}
            </p>
          </div>
          <p className="font-extrabold">{zl(j.price.total)}</p>
        </div>
      ))}
    </div>
  );
}
