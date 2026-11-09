import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sendMessage } from "../lib/store";
import type { Job } from "../lib/types";

const QUICK = {
  client: ["Gdzie Pan jest?", "Stoję na awaryjnych", "Auto jest za barierką", "Proszę zadzwonić przez aplikację"],
  driver: ["Jestem w drodze", "Będę za 5 min", "Jestem na miejscu", "Proszę przygotować dowód rej. i kluczyki"],
};

/** Czat w aplikacji – jedyny kanał kontaktu (numery telefonów są ukryte). */
export default function Chat({ job, as, dark = false }: { job: Job; as: "client" | "driver"; dark?: boolean }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [job.messages.length]);
  const send = (t: string) => {
    sendMessage(job.id, as, t);
    setText("");
  };
  return (
    <div className={`rounded-2xl p-3 ${dark ? "bg-ink-2 text-white" : "bg-white dark:bg-ink-2"}`}>
      <p className="label mb-2">Wiadomości w aplikacji</p>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {job.messages.length === 0 && <p className="text-sm text-muted">Brak wiadomości. Numery telefonów są ukryte – piszcie tutaj.</p>}
        {job.messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === as ? "justify-end" : "justify-start"}`}>
            <span className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === as ? "bg-brand text-ink" : "bg-paper text-ink dark:bg-ink-3 dark:text-white"}`}>{m.text}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {QUICK[as].map((q) => (
          <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-ink-3">
            {q}
          </button>
        ))}
      </div>
      <form
        className="mt-1 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input className="input py-2 text-ink" placeholder="Napisz wiadomość…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn grid h-11 w-11 shrink-0 place-items-center bg-brand text-ink" aria-label="Wyślij">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
