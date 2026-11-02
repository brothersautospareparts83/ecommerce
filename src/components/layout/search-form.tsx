"use client";

import { useLang } from "@/lib/i18n";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain GET form (works without JavaScript): submits to /shop?q=... */
export function SearchForm({ id, className, defaultValue }: { id: string; className?: string; defaultValue?: string }) {
  const { tl } = useLang();
  return (
    <form action="/shop" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">Search parts</label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={tl("Search parts, part numbers, brands…")}
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-chrome-border bg-black/[0.04] dark:bg-white/5 pl-4 pr-12 text-sm text-chrome-fg outline-none placeholder:text-chrome-muted focus:border-accent"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1 inline-flex h-9 w-10 items-center justify-center rounded-md bg-accent text-accent-fg cursor-pointer"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
