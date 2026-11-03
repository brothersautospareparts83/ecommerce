"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KEY = "ba-appearance";

type Settings = { theme: string; font: string; size: string; lh: string; round: string; motion: string };
const DEFAULTS: Settings = { theme: "orange", font: "inter", size: "m", lh: "normal", round: "soft", motion: "on" };

type Option = { value: string; en: string; sw: string; swatch?: string; sample?: string };
const GROUPS: { key: keyof Settings; en: string; sw: string; options: Option[] }[] = [
  { key: "theme", en: "Colours", sw: "Rangi", options: [
    { value: "orange", en: "Orange", sw: "Machungwa", swatch: "#f47b20" },
    { value: "gold", en: "Gold", sw: "Dhahabu", swatch: "#d4af37" },
  ] },
  { key: "font", en: "Font", sw: "Herufi", options: [
    { value: "inter", en: "Inter", sw: "Inter", sample: "var(--font-inter)" },
    { value: "poppins", en: "Poppins", sw: "Poppins", sample: "var(--font-poppins)" },
    { value: "montserrat", en: "Montserrat", sw: "Montserrat", sample: "var(--font-montserrat)" },
    { value: "classic", en: "Classic", sw: "Kawaida", sample: "Georgia, serif" },
  ] },
  { key: "size", en: "Text size", sw: "Ukubwa wa maandishi", options: [
    { value: "s", en: "Small", sw: "Ndogo" }, { value: "m", en: "Normal", sw: "Kawaida" }, { value: "l", en: "Large", sw: "Kubwa" },
  ] },
  { key: "lh", en: "Line spacing", sw: "Nafasi ya mistari", options: [
    { value: "tight", en: "Tight", sw: "Karibu" }, { value: "normal", en: "Normal", sw: "Kawaida" }, { value: "airy", en: "Airy", sw: "Pana" },
  ] },
  { key: "round", en: "Corners", sw: "Pembe", options: [
    { value: "sharp", en: "Sharp", sw: "Kali" }, { value: "soft", en: "Soft", sw: "Laini" }, { value: "round", en: "Round", sw: "Mviringo" },
  ] },
  { key: "motion", en: "Motion", sw: "Mwendo", options: [
    { value: "on", en: "On", sw: "Washa" }, { value: "off", en: "Off", sw: "Zima" },
  ] },
];

function apply(s: Settings) {
  const d = document.documentElement;
  d.dataset.theme = s.theme;
  d.dataset.font = s.font;
  d.dataset.size = s.size;
  d.dataset.lh = s.lh;
  d.dataset.round = s.round;
  d.dataset.motion = s.motion;
}

/** Appearance settings: colours, font, text size, line spacing, corners and motion. Saved on this device; the inline script in the layout applies them before first paint. */
export function AppearancePanel() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // The saved settings live in the browser only, so they are read after hydration.
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setS({ ...DEFAULTS, ...saved });
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => {
    if (!touched) return;
    apply(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: lasts for this visit */ }
  }, [s, touched]);

  const set = (key: keyof Settings, value: string) => {
    setTouched(true);
    setS((o) => ({ ...o, [key]: value }));
  };
  const reset = () => {
    setTouched(true);
    setS(DEFAULTS);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("Appearance settings", "Mipangilio ya muonekano")} className="flex h-10 w-10 cursor-pointer items-center justify-center text-white">
        <SlidersHorizontal className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={t("Appearance", "Muonekano")}>
          <button type="button" aria-label={t("Close", "Funga")} onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 text-fg shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{t("Appearance", "Muonekano")}</h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={reset} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted hover:bg-surface-2">
                  <RotateCcw className="h-3.5 w-3.5" /> {t("Reset", "Rudisha")}
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("Close", "Funga")} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-surface-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t(g.en, g.sw)}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const on = s[g.key] === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => set(g.key, o.value)}
                          aria-pressed={on}
                          style={o.sample ? { fontFamily: o.sample } : undefined}
                          className={cn("flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold", on ? "border-accent bg-accent-soft text-fg" : "border-border bg-bg text-muted")}
                        >
                          {o.swatch && <span className="h-4 w-4 rounded-full" style={{ background: o.swatch }} />}
                          {t(o.en, o.sw)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
