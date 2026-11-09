import { ArrowLeft, Check, Moon, RotateCcw, Truck, User } from "lucide-react";
import { useState } from "react";
import { Toggle, zl } from "../components/ui";
import { CANCEL_PENALTY, FEE_MIN, FEE_PCT, START_BONUS } from "../lib/fees";
import { TRUCK_LABEL } from "../lib/pricing";
import { becomeDriver, resetDemo, setMode, useStore } from "../lib/store";
import type { TruckType } from "../lib/types";

export default function Settings({
  onClose,
  dark,
  setDark,
  split,
  setSplit,
}: {
  onClose: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  split: boolean;
  setSplit: (v: boolean) => void;
}) {
  const isDriver = useStore((s) => s.isDriver);
  const mode = useStore((s) => s.mode);
  const [onboarding, setOnboarding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="absolute inset-0 z-[900] overflow-y-auto bg-paper dark:bg-ink">
      <div className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-card dark:bg-ink-2" aria-label="Wróć">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-extrabold">Ustawienia</h1>
        </div>

        {isDriver ? (
          <div className="card p-4">
            <p className="label">Tryb aplikacji</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["client", "Klient", User, "Zamawiam lawetę"],
                  ["driver", "Laweciarz", Truck, "Przyjmuję zlecenia"],
                ] as const
              ).map(([id, label, Icon, hint]) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id);
                    onClose();
                  }}
                  className={`chip ${mode === id ? "chip-on" : ""}`}
                >
                  <Icon className="mb-1 h-6 w-6" />
                  {label}
                  <div className="text-xs font-normal text-muted">{hint}</div>
                </button>
              ))}
            </div>
          </div>
        ) : onboarding ? (
          <DriverOnboarding onDone={onClose} />
        ) : (
          <div className="rounded-2xl bg-ink p-5 text-white">
            <Truck className="h-8 w-8 text-brand" />
            <h2 className="mt-2 text-xl font-extrabold">Masz lawetę? Zostań laweciarzem</h2>
            <p className="mt-1 text-sm text-slate-300">
              Zlecenia z okolicy prosto na telefon, bez wydawania na Google Ads. Włączasz dyżur, gdy pracujesz. Płacisz tylko za przyjęte zlecenie: {FEE_PCT}% (min. {zl(FEE_MIN)}).
            </p>
            <button className="btn-primary mt-4 w-full" onClick={() => setOnboarding(true)}>
              Zostań laweciarzem
            </button>
          </div>
        )}

        <div className="card divide-y divide-slate-100 px-4 dark:divide-ink-3">
          <div className="flex items-center gap-2 py-1">
            <Moon className="h-4 w-4 text-muted" />
            <div className="flex-1">
              <Toggle label="Tryb ciemny" on={dark} onChange={setDark} />
            </div>
          </div>
          <div className="hidden lg:block">
            <Toggle label="Demo: oba telefony obok siebie" on={split} onChange={setSplit} />
          </div>
        </div>

        <div className="card p-4">
          {confirmReset ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Usunąć wszystkie dane demo (zlecenia, portfel, konto laweciarza)?</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  Nie
                </button>
                <button
                  className="btn min-h-[48px] bg-bad text-white"
                  onClick={() => {
                    resetDemo();
                    onClose();
                  }}
                >
                  Tak, wyczyść
                </button>
              </div>
            </div>
          ) : (
            <button className="flex w-full items-center gap-2 font-semibold text-muted" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" /> Wyczyść dane demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverOnboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [truck, setTruck] = useState<TruckType>("laweta");
  const [plate, setPlate] = useState("");
  const [maxKg, setMaxKg] = useState(3500);
  const [nip, setNip] = useState("");
  const [agree, setAgree] = useState(false);
  const ok = name.trim() && plate.trim().length >= 4 && nip.replace(/\D/g, "").length === 10 && agree;

  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        becomeDriver({ name: name.trim(), truck, plate: plate.toUpperCase(), maxKg, company: `NIP ${nip}`, verified: false });
        onDone();
      }}
    >
      <h2 className="text-xl font-extrabold">Rejestracja laweciarza</h2>
      <p className="text-sm text-muted">Klient zobaczy tylko typ lawety, Twoje imię, ocenę i czy jesteś wolny. Numer telefonu jest ukryty – kontakt w aplikacji.</p>
      <input id="op-name" className="input" placeholder="Imię operatora" value={name} onChange={(e) => setName(e.target.value)} />
      <select id="op-truck" className="input" value={truck} onChange={(e) => setTruck(e.target.value as TruckType)}>
        {Object.entries(TRUCK_LABEL).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input id="op-plate" className="input" placeholder="Nr rej. lawety" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <input id="op-kg" className="input" type="number" step={100} placeholder="Ładowność kg" value={maxKg} onChange={(e) => setMaxKg(+e.target.value)} />
      </div>
      <input id="op-nip" className="input" inputMode="numeric" placeholder="NIP firmy (10 cyfr)" value={nip} onChange={(e) => setNip(e.target.value)} />
      <p className="text-xs text-muted">W wersji produkcyjnej: weryfikacja NIP w CEIDG, zdjęcie dowodu rej. lawety i polisy OC/OCPD.</p>
      <label className="flex items-start gap-3 rounded-xl bg-paper p-3 text-sm dark:bg-ink-3">
        <input id="op-agree" type="checkbox" className="mt-1 h-5 w-5 accent-[#FF7A00]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          Akceptuję regulamin: prowizja {FEE_PCT}% (min. {zl(FEE_MIN)}) z portfela za każde przyjęte zlecenie, kara {zl(CANCEL_PENALTY)} za anulowanie po przyjęciu, kontakt z klientem tylko przez aplikację.
        </span>
      </label>
      <button className="btn-primary w-full" disabled={!ok}>
        <Check /> Zarejestruj · {zl(START_BONUS)} bonusu na start
      </button>
    </form>
  );
}
