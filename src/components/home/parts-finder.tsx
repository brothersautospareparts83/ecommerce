"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Hash, ScanLine, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modes = [
  { id: "vin", label: "Chassis / VIN", icon: ScanLine, placeholder: "Enter chassis number, VIN or frame number" },
  { id: "oem", label: "OEM Part Number", icon: Hash, placeholder: "e.g. enter an OEM or part number" },
  { id: "name", label: "Product Name", icon: Search, placeholder: "e.g. brake pads, chujio la oil, front shock" },
  { id: "vehicle", label: "Select Vehicle", icon: CarFront, placeholder: "Make, model and year, e.g. Toyota Harrier 2015" },
] as const;

export function PartsFinder() {
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("name");
  const [q, setQ] = useState("");
  const router = useRouter();
  const active = modes.find((m) => m.id === mode)!;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
      <div role="tablist" aria-label="Search method" className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
              mode === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
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
          placeholder={active.placeholder}
          className="h-12 flex-1 rounded-lg border border-border bg-bg px-4 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <Button type="submit" size="lg">
          <Search className="h-4 w-4" /> Find Parts
        </Button>
      </form>
    </div>
  );
}
