"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Send, X } from "lucide-react";
import { askAssistant, type AssistantItem } from "@/app/assistant/actions";
import { useLang } from "@/lib/i18n";
import { whatsappUrl } from "@/lib/site";
import { cn, formatPrice, formatTZS } from "@/lib/utils";

type Msg = { from: "bot" | "me"; text: string; items?: AssistantItem[]; handoff?: string };

const SUGGESTIONS = ["Brake pad", "Shock absorber", "Oil filter", "Clutch plate", "Radiator"];

const WA = (
  <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.19 1.6 6.01L4 29l8.15-1.57a12 12 0 0 0 3.89.65c6.64 0 12.04-5.4 12.04-12.04C28.08 8.4 22.68 3 16.04 3Zm0 21.9c-1.2 0-2.37-.32-3.4-.93l-.24-.14-4.84.93.94-4.72-.16-.25a9.86 9.86 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9s9.9 4.44 9.9 9.9-4.44 10.36-9.9 10.36Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
  </svg>
);

/**
 * The floating chat button. It looks like WhatsApp but is our own parts assistant: it answers from the real catalogue
 * (names, part numbers, prices). Only when the customer is ready to order does it hand over to our WhatsApp inbox,
 * with the whole order written out, so we can close the sale there.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [order, setOrder] = useState<AssistantItem[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  const hello = t(
    "Hello! I am the Brothers Auto parts assistant. Ask me for a part, its price, or a part number. You can add your car too, for example \"brake pad Toyota Hilux\".",
    "Habari! Mimi ni msaidizi wa vipuri wa Brothers Auto. Niulize kipuri, bei yake, au namba ya kipuri. Unaweza kuongeza gari lako, kwa mfano \"brake pad Toyota Hilux\".",
  );

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open, pending, order.length]);

  // Other buttons on the page (for example the "Start Chat" card) open the assistant with this event.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("open-assistant", show);
    return () => window.removeEventListener("open-assistant", show);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  const total = order.reduce((n, i) => n + i.priceTzs, 0);

  const send = (q: string) => {
    const v = q.trim();
    if (!v || pending) return;
    setMsgs((m) => [...m, { from: "me", text: v }]);
    setText("");
    start(async () => {
      try {
        const r = await askAssistant(v, msgs.map((m) => ({ role: m.from === "me" ? ("user" as const) : ("assistant" as const), text: m.text })), lang);
        setMsgs((m) => [...m, { from: "bot", text: r.text, items: r.items, handoff: r.handoff ? v : undefined }]);
      } catch {
        setMsgs((m) => [...m, { from: "bot", text: t("Sorry, I could not answer just now. Please message us on WhatsApp.", "Samahani, sijaweza kujibu sasa hivi. Tafadhali tutumie ujumbe WhatsApp."), handoff: v }]);
      }
    });
  };

  const add = (it: AssistantItem) => setOrder((o) => (o.some((x) => x.slug === it.slug) ? o : [...o, it]));
  const remove = (slug: string) => setOrder((o) => o.filter((x) => x.slug !== slug));

  /** The closing step: the whole order goes to our WhatsApp inbox. */
  const finishUrl = () => {
    const lines = order.map((i) => `- 1 x ${i.name}${i.partNumber ? ` (${i.partNumber})` : ` (${i.sku})`}: ${formatPrice(i.priceTzs)}`);
    const msg = [
      "Hello Brothers Auto, I would like to order:",
      ...lines,
      `Total: ${formatTZS(total)}`,
      name.trim() ? `Name: ${name.trim()}` : "",
      "Please confirm availability, delivery fee and how to pay.",
    ]
      .filter(Boolean)
      .join("\n");
    return whatsappUrl(msg);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("Chat with us", "Ongea nasi")}
          className="fixed bottom-[4.75rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-6"
        >
          {WA}
          {order.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg">{order.length}</span>}
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label={t("Parts assistant", "Msaidizi wa vipuri")}
          className="fixed inset-x-3 bottom-[4.75rem] z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[390px] lg:bottom-6"
        >
          <div className="flex items-center justify-between bg-[#1fa855] px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm font-extrabold">Brothers Auto</p>
              <p className="text-[11px] text-white/85">{t("Parts assistant: answers from our catalogue", "Msaidizi wa vipuri: majibu kutoka kwenye orodha yetu")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("Close", "Funga")} className="rounded-lg p-1.5 hover:bg-white/15">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            <Bubble from="bot">
              <p className="whitespace-pre-line leading-relaxed">{hello}</p>
            </Bubble>
            {msgs.map((m, i) => (
              <Bubble key={i} from={m.from}>
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                {m.items && m.items.length > 0 && (
                  <ul className="space-y-2">
                    {m.items.map((it) => {
                      const added = order.some((x) => x.slug === it.slug);
                      return (
                        <li key={it.slug} className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-900">
                          <Link href={`/products/${it.slug}`} onClick={() => setOpen(false)} className="flex gap-2">
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
                          {it.priceTzs > 0 && (
                            <button
                              type="button"
                              onClick={() => (added ? remove(it.slug) : add(it))}
                              className={cn("mt-2 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold", added ? "bg-zinc-200 text-zinc-700" : "bg-accent text-accent-fg")}
                            >
                              {added ? t("Added: tap to remove", "Imewekwa: bonyeza kuondoa") : (<><Plus className="h-3.5 w-3.5" /> {t("Add to order", "Weka kwenye oda")}</>)}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {m.handoff && (
                  <a href={whatsappUrl(`Hello Brothers Auto, ${m.handoff}`)} target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-[#1fa855] px-3 py-1.5 text-xs font-bold text-white">
                    {t("Talk to a person on WhatsApp", "Ongea na mtu kwenye WhatsApp")}
                  </a>
                )}
              </Bubble>
            ))}
            {pending && <p className="text-xs text-muted">{t("Looking it up…", "Natafuta…")}</p>}
            <div ref={end} />
          </div>

          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-accent">
                  {s}
                </button>
              ))}
            </div>
          )}

          {order.length > 0 && (
            <div className="space-y-2 border-t border-border bg-surface-2 p-3 text-xs">
              <p className="font-bold">
                {t("Your order", "Oda yako")} ({order.length}): {formatTZS(total)}
              </p>
              <ul className="space-y-0.5 text-muted">
                {order.map((i) => (
                  <li key={i.slug} className="flex justify-between gap-2">
                    <span className="truncate">{i.name}</span>
                    <button type="button" onClick={() => remove(i.slug)} className="shrink-0 underline" aria-label={t(`Remove ${i.name}`, `Ondoa ${i.name}`)}>
                      {t("remove", "ondoa")}
                    </button>
                  </li>
                ))}
              </ul>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder={t("Your name (optional)", "Jina lako (si lazima)")}
                aria-label={t("Your name", "Jina lako")}
                className="h-9 w-full rounded-md border border-border bg-surface px-2"
              />
              <a href={finishUrl()} target="_blank" rel="noopener noreferrer" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1fa855] text-sm font-bold text-white">
                {t("Finish on WhatsApp", "Maliza kwa WhatsApp")}
              </a>
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
              placeholder={t("Type a part or part number…", "Andika kipuri au namba ya kipuri…")}
              aria-label={t("Your message", "Ujumbe wako")}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <button type="submit" disabled={pending || !text.trim()} aria-label={t("Send", "Tuma")} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1fa855] text-white disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ from, children }: { from: "bot" | "me"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", from === "me" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[90%] space-y-2 rounded-2xl px-3 py-2", from === "me" ? "bg-[#1fa855] text-white" : "bg-surface-2")}>{children}</div>
    </div>
  );
}
