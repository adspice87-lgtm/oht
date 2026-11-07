import { Star, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export const zl = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} zł`;

export function Rating({ value, jobs }: { value: number; jobs?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <Star className="h-4 w-4 fill-brand text-brand" />
      {value.toFixed(1)}
      {jobs !== undefined && <span className="font-normal text-muted">({jobs})</span>}
    </span>
  );
}

export function Verified() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-2 py-0.5 text-xs font-bold text-ok">
      <ShieldCheck className="h-3.5 w-3.5" /> Zweryfikowany
    </span>
  );
}

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-x-0 bottom-0 z-[500] max-h-[78%] overflow-y-auto rounded-t-3xl bg-paper p-4 pb-6 shadow-[0_-8px_30px_rgba(14,26,43,.18)] dark:bg-ink ${className}`}>
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-ink-3" />
      {children}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center justify-between py-2 text-left">
      <span className="font-medium">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? "bg-brand" : "bg-slate-300 dark:bg-ink-3"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-slate-200 dark:bg-ink-3"}`} />
      ))}
    </div>
  );
}
