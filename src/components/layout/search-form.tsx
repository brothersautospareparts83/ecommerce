"use client";

import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
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
        className="h-12 w-full rounded-full border border-border bg-bg pl-5 pr-14 text-[15px] outline-none placeholder:text-muted focus:border-accent focus:bg-surface"
      />
      <button type="submit" aria-label={tl("Search")} className="absolute right-1.5 top-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-fg">
        <Search className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </form>
  );
}
