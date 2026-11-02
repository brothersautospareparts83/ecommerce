import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartBadge } from "@/components/cart/cart-badge";
import { SearchForm } from "./search-form";
import { LangSwitch, TL } from "@/lib/i18n";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/parts-guide", label: "Parts Guide" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** Sticky header: logo, language and cart on one row, a large search field under it. Links show on wide screens only (phones use the bottom bar). */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-2 pt-3 lg:gap-8 lg:py-3">
        <Link href="/" aria-label="Brothers Auto Spare Parts, home" className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/logo-emblem-ink.webp" alt="" width={480} height={327} priority className="h-9 w-auto" />
          <span className="leading-none">
            <span className="block text-[17px] font-extrabold italic tracking-wide">BROTHERS</span>
            <span className="block text-[9px] font-semibold tracking-[0.22em] text-accent-text">AUTO SPARE PARTS</span>
          </span>
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-6 text-sm font-medium lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-fg">
              <TL k={l.label} />
            </Link>
          ))}
        </nav>
        <SearchForm id="search-desktop" className="hidden max-w-md flex-1 lg:ml-auto lg:block" />
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <LangSwitch className="flex items-center gap-1 text-xs font-semibold" />
          <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
            <ShoppingBag className="h-5 w-5" />
            <CartBadge />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-3 lg:hidden">
        <SearchForm id="search-mobile" />
      </div>
    </header>
  );
}
