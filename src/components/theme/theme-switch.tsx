"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const KEY = "ba-theme";
type Theme = "orange" | "gold";

/** Two colour themes, saved on this device. The inline script in the layout applies the saved theme before first paint. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("orange");
  useEffect(() => {
    // The saved theme lives in the browser only, so it is read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "gold" ? "gold" : "orange");
  }, []);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* private mode: the theme lasts for this visit */ }
  }, [theme, touched]);
  const pick = (t: Theme) => {
    setTouched(true);
    setTheme(t);
  };
  const dot = (t: Theme, color: string, label: string) => (
    <button
      type="button"
      onClick={() => pick(t)}
      aria-label={label}
      aria-pressed={theme === t}
      className={cn("h-5 w-5 cursor-pointer rounded-full border-2", theme === t ? "border-white" : "border-white/30")}
      style={{ background: color }}
    />
  );
  return (
    <span className={cn("flex items-center gap-1.5", className)} role="group" aria-label="Theme">
      {dot("orange", "#f47b20", "Orange theme")}
      {dot("gold", "#d4af37", "Gold theme")}
    </span>
  );
}
