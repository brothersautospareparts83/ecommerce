"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/demo-data";

type Item = { href: string; label: string; match?: string; children?: { href: string; label: string }[] };

const items: Item[] = [
  { href: "/", label: "Home" },
  {
    href: "/shop",
    label: "Shop",
    children: [
      { href: "/shop", label: "All Products" },
      { href: "/categories", label: "All Categories" },
      ...categories.slice(0, 6).map((c) => ({ href: `/categories/${c.slug}`, label: c.name })),
    ],
  },
  { href: "/finder?mode=vehicle", match: "/finder", label: "Vehicle Catalog" },
  { href: "/ai-assistant", label: "AI Assistant" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  {
    href: "/quotation",
    label: "More",
    children: [
      { href: "/quotation", label: "Request a Quotation" },
      { href: "/faq", label: "FAQ" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

export function NavBar() {
  const pathname = usePathname();
  const isActive = (i: Item) => {
    const base = i.match ?? i.href.split("?")[0];
    if (i.label === "More") return false;
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  return (
    <nav aria-label="Main" className="hidden border-y border-chrome-border bg-chrome lg:block">
      <ul className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-1.5">
        {items.map((i) => {
          const active = isActive(i);
          const cls = cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            active ? "bg-accent text-accent-fg" : "text-chrome-fg/80 hover:text-accent",
          );
          return (
            <li key={i.label} className="group relative">
              <Link href={i.href} className={cls} aria-current={active ? "page" : undefined}>
                {i.label === "Home" && <Home className="h-4 w-4" aria-hidden="true" />}
                {i.label}
                {i.children && <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
              </Link>
              {i.children && (
                <ul className="invisible absolute left-0 top-full z-50 min-w-56 translate-y-1 rounded-xl border border-chrome-border bg-chrome p-2 opacity-0 shadow-card transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {i.children.map((c) => (
                    <li key={c.href + c.label}>
                      <Link href={c.href} className="block rounded-lg px-3 py-2 text-sm text-chrome-fg/85 hover:bg-white/5 hover:text-accent">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
