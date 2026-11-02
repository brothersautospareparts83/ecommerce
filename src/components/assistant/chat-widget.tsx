"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { askAssistant, type AssistantItem } from "@/app/assistant/actions";
import { whatsappUrl } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";

type Msg = { from: "bot" | "me"; text: string; items?: AssistantItem[]; wa?: string };

const HELLO: Msg = {
  from: "bot",
  text: "Hello! I am the Brothers Auto parts assistant. Ask me for a part, its price, or a part number. You can add your car too, for example \"brake pad Toyota Hilux\".",
};
const SUGGESTIONS = ["Brake pad", "Shock absorber", "Oil filter", "Clutch plate", "Radiator"];

/** Floating parts assistant. It answers from the real catalogue (names, part numbers, prices) and hands over to WhatsApp. */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open, pending]);

  if (pathname.startsWith("/admin")) return null;

  const send = (q: string) => {
    const t = q.trim();
    if (!t || pending) return;
    setMsgs((m) => [...m, { from: "me", text: t }]);
    setText("");
    start(async () => {
      try {
        const r = await askAssistant(t);
        setMsgs((m) => [
          ...m,
          { from: "bot", text: r.text, items: r.items, wa: `Hello Brothers Auto, ${t}` },
        ]);
      } catch {
        setMsgs((m) => [...m, { from: "bot", text: "Sorry, I could not answer just now. Please message us on WhatsApp.", wa: `Hello Brothers Auto, ${t}` }]);
      }
    });
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the parts assistant"
          className="fixed bottom-[4.75rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform hover:scale-105 lg:bottom-6"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Parts assistant"
          className="fixed inset-x-3 bottom-[4.75rem] z-50 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[380px] lg:bottom-6"
        >
          <div className="flex items-center justify-between bg-hero px-4 py-3 text-hero-fg">
            <div>
              <p className="font-display text-sm font-extrabold">Parts assistant</p>
              <p className="text-[11px] text-[#c4c4c8]">Answers from our catalogue</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" className="rounded-lg p-1.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[88%] space-y-2 rounded-2xl px-3 py-2", m.from === "me" ? "bg-accent text-accent-fg" : "bg-surface-2")}>
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  {m.items && m.items.length > 0 && (
                    <ul className="space-y-2">
                      {m.items.map((it) => (
                        <li key={it.slug}>
                          <Link href={`/products/${it.slug}`} onClick={() => setOpen(false)} className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-900">
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                              {it.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={it.imageUrl} alt="" className="h-full w-full object-contain" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold">{it.name}</span>
                              <span className="block truncate text-[11px] text-zinc-500">{it.partNumber ? `Part no. ${it.partNumber}` : `SKU ${it.sku}`}</span>
                              <span className="block text-xs font-extrabold">{formatPrice(it.priceTzs)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.wa && (
                    <a href={whatsappUrl(m.wa)} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-emerald-700 underline dark:text-emerald-400">
                      Ask or order on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
            {pending && <p className="text-xs text-muted">Looking it up…</p>}
            <div ref={end} />
          </div>

          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-accent">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              placeholder="Type a part or part number…"
              aria-label="Your message"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-fg disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
