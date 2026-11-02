"use client";

import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Plain GET form (works without JavaScript): submits to /shop?q=... White field with a magnifier, as in the approved design. */
export function SearchForm({ id, className, defaultValue }: { id: string; className?: string; defaultValue?: string }) {
  const { tl } = useLang();
  return (
    <form action="/shop" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">Search parts</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={tl("Search parts…")}
        autoComplete="off"
        className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-3 text-[15px] text-fg outline-none placeholder:text-muted"
      />
      <button type="submit" className="sr-only">{tl("Search")}</button>
    </form>
  );
}
