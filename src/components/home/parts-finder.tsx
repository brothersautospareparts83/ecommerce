"use client";

import { TL, useLang } from "@/lib/i18n";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Hash, ScanLine, CarFront, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modes = [
  { id: "vin", label: "Chassis No.", icon: ScanLine, placeholder: "Enter chassis number, VIN or frame number" },
  { id: "oem", label: "Part Number", icon: Hash, placeholder: "Enter an OEM or part number" },
  { id: "name", label: "Part Name", icon: Search, placeholder: "e.g. brake pads, chujio la oil, front shock" },
  { id: "vehicle", label: "Vehicle", icon: CarFront, placeholder: "Make, model and year, e.g. Toyota Harrier 2015" },
] as const;

export function PartsFinder() {
  const { tl } = useLang();
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("name");
  const [q, setQ] = useState("");
  const router = useRouter();
  const active = modes.find((m) => m.id === mode)!;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold sm:text-xl">
        <Zap className="h-5 w-5 text-accent" aria-hidden="true" /> <TL k="Find Your Exact Spare Part" />
      </h2>
      <div role="tablist" aria-label="Search method" className="mb-4 grid grid-cols-4 gap-2">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2.5 text-[11px] font-semibold leading-tight transition-colors cursor-pointer sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
              mode === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            <Icon className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" /> <span><TL k={label} /></span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/finder?mode=${mode}&q=${encodeURIComponent(q.trim())}`);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="finder-q" className="sr-only">{active.label}</label>
        <input
          id="finder-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tl(active.placeholder)}
          className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-bg px-4 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <Button type="submit" size="lg">
          <Search className="h-4 w-4" /> <TL k="Search" />
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted">
        <TL k="Search by name (English or Kiswahili), part number or SKU." />{" "}
        <Link href="/shop" className="font-semibold text-accent-text hover:underline"><TL k="Browse all parts" /></Link>
      </p>
    </div>
  );
}
