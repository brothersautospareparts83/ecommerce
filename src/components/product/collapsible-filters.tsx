"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/** On phones the shop filters sit behind a button so products start near the top; on large screens they are always shown. */
export function CollapsibleFilters({ children, activeCount = 0 }: { children: React.ReactNode; activeCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-lg px-1 text-sm font-semibold lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div className={cn("mt-2 lg:mt-0 lg:block", open ? "block" : "hidden")}>{children}</div>
    </>
  );
}
