"use client";

import { useLang } from "@/lib/i18n";

/** Plain GET form (works without JavaScript): submits to /shop?q=... */
export function SearchForm({ id, className, defaultValue }: { id: string; className?: string; defaultValue?: string }) {
  const { tl } = useLang();
  return (
    <form action="/shop" role="search" className={className}>
      <label htmlFor={id} className="sr-only">Search parts</label>
      <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder={tl("Search parts, part numbers, brands…")} autoComplete="off" />
      <button type="submit">Search</button>
    </form>
  );
}
