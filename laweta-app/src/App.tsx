import { Moon, RotateCcw, Sun, Truck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME, SLOGAN } from "./lib/copy";
import { isNight } from "./lib/pricing";
import { resetDemo, tick } from "./lib/store";
import ClientApp from "./screens/ClientApp";
import DriverApp from "./screens/DriverApp";

type Role = "client" | "driver" | "both";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-ink">
        <Truck className="h-5 w-5" strokeWidth={2.6} />
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold tracking-tight">{APP_NAME}</div>
        <div className="hidden text-[11px] text-muted sm:block">{SLOGAN}</div>
      </div>
    </div>
  );
}

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <p className="label mb-2">{title}</p>
      <div className="h-[780px] w-[390px] overflow-hidden rounded-[44px] border-[10px] border-ink bg-paper shadow-2xl dark:border-ink-3 dark:bg-ink">{children}</div>
    </div>
  );
}

export default function App() {
  const initialRole = (new URLSearchParams(location.search).get("rola") as Role) || (window.innerWidth >= 1024 ? "both" : "client");
  const [role, setRole] = useState<Role>(initialRole);
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

  return (
    <div className="flex h-full flex-col">
      <header className="z-[600] flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-ink-3 dark:bg-ink-2">
        <Logo />
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-xl bg-paper p-1 dark:bg-ink">
            {(
              [
                ["client", "Klient", User],
                ["driver", "Laweciarz", Truck],
                ["both", "Oba", null],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold ${role === id ? "bg-brand text-ink" : "text-muted"} ${id === "both" ? "hidden lg:flex" : ""}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setDark(!dark)} className="grid h-9 w-9 place-items-center rounded-xl bg-paper dark:bg-ink" aria-label="Tryb ciemny">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => resetDemo()}
            className="grid h-9 w-9 place-items-center rounded-xl bg-paper dark:bg-ink"
            aria-label="Reset demo"
            title="Reset demo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {role === "both" ? (
          <div className="flex h-full items-center justify-center gap-10 overflow-auto bg-gradient-to-b from-paper to-slate-200 p-6 dark:from-ink dark:to-ink-2">
            <Phone title="Klient">
              <ClientApp dark={dark} now={now} />
            </Phone>
            <Phone title="Laweciarz">
              <DriverApp dark={dark} />
            </Phone>
          </div>
        ) : (
          <div className="mx-auto h-full max-w-md">
            {role === "client" ? <ClientApp dark={dark} now={now} /> : <DriverApp dark={dark} />}
          </div>
        )}
      </main>
    </div>
  );
}
