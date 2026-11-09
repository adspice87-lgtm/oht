import { Settings as Gear, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME, SLOGAN } from "./lib/copy";
import { isNight } from "./lib/pricing";
import { tick, useStore } from "./lib/store";
import ClientApp from "./screens/ClientApp";
import DriverApp from "./screens/DriverApp";
import Settings from "./screens/Settings";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-ink">
        <Truck className="h-5 w-5" strokeWidth={2.6} />
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold tracking-tight">{APP_NAME}</div>
        <div className="text-[11px] text-muted">{SLOGAN}</div>
      </div>
    </div>
  );
}

function Header({ onSettings }: { onSettings: () => void }) {
  const mode = useStore((s) => s.mode);
  return (
    <header className="z-[600] flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-ink-3 dark:bg-ink-2">
      <Logo />
      <div className="flex items-center gap-2">
        {mode === "driver" && <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-ink">LAWECIARZ</span>}
        <button onClick={onSettings} className="grid h-10 w-10 place-items-center rounded-xl bg-paper dark:bg-ink" aria-label="Ustawienia">
          <Gear className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <p className="label mb-2">{title}</p>
      <div className="relative h-[780px] w-[390px] overflow-hidden rounded-[44px] border-[10px] border-ink bg-paper shadow-2xl dark:border-ink-3 dark:bg-ink">{children}</div>
    </div>
  );
}

export default function App() {
  const mode = useStore((s) => s.mode);
  const [settings, setSettings] = useState(false);
  const [split, setSplit] = useState(false);
  const [dark, setDark] = useState(isNight() || new Date().getHours() >= 19 || new Date().getHours() < 7);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const settingsEl = settings && <Settings onClose={() => setSettings(false)} dark={dark} setDark={setDark} split={split} setSplit={setSplit} />;

  if (split)
    return (
      <div className="relative flex h-full flex-col">
        <Header onSettings={() => setSettings(true)} />
        <div className="flex min-h-0 flex-1 items-center justify-center gap-10 overflow-auto bg-gradient-to-b from-paper to-slate-200 p-6 dark:from-ink dark:to-ink-2">
          <Phone title="Klient">
            <ClientApp dark={dark} now={now} />
          </Phone>
          <Phone title="Laweciarz">
            <DriverApp dark={dark} />
          </Phone>
        </div>
        {settingsEl}
      </div>
    );

  return (
    <div className="relative mx-auto flex h-full max-w-md flex-col">
      <Header onSettings={() => setSettings(true)} />
      <main className="relative min-h-0 flex-1">{mode === "driver" ? <DriverApp dark={dark} /> : <ClientApp dark={dark} now={now} />}</main>
      {settingsEl}
    </div>
  );
}
