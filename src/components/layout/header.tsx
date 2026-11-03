"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { CartBadge } from "@/components/cart/cart-badge";
import { SearchForm } from "./search-form";
import { AppearancePanel } from "@/components/theme/appearance-panel";
import { LangSwitch, TL } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/orders/track", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const titles: [string, string][] = [
  ["/shop", "Shop"], ["/products", "Product"], ["/cart", "Cart"], ["/checkout/done", "Order received"], ["/checkout", "Checkout"],
  ["/categories", "Categories"], ["/about", "About Us"], ["/contact", "Contact"], ["/orders", "Track order"],
];

function Logo() {
  return (
    <Link href="/" aria-label="Brothers Auto Spare Parts, home" className="flex shrink-0 items-center gap-2.5 text-white">
      <Image src="/brand/logo-emblem-v2.webp" alt="" width={480} height={327} priority className="h-9 w-auto" />
      <span className="leading-none">
        <span className="block text-[17px] font-black italic tracking-wide">BROTHERS</span>
        <span className="block text-[8.5px] font-bold tracking-[0.2em] text-accent">AUTO SPARE PARTS</span>
      </span>
    </Link>
  );
}

function CartLink() {
  return (
    <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center text-white">
      <ShoppingCart className="h-6 w-6" />
      <CartBadge />
    </Link>
  );
}

/** Black header as in the approved design. Phones: logo row and search on the home page, a back arrow with the page title elsewhere. Wide screens: logo, links, search. */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const home = pathname === "/";
  const title = titles.find(([p]) => pathname.startsWith(p))?.[1] ?? "Brothers Auto";
  return (
    <header className="sticky top-0 z-40 bg-chrome text-chrome-fg">
      {/* Phones */}
      <div className="lg:hidden">
        {home ? (
          <div className="px-4 pb-3 pt-3">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <div className="flex items-center gap-1">
                <LangSwitch className="flex items-center gap-1 text-xs font-bold text-white" />
                <AppearancePanel />
                <CartLink />
              </div>
            </div>
            <SearchForm id="search-mobile" className="mt-3" />
          </div>
        ) : (
          <div className="grid h-14 grid-cols-[48px_1fr_auto] items-center px-2">
            <button type="button" onClick={() => router.back()} aria-label="Back" className="flex h-10 w-10 cursor-pointer items-center justify-center text-white">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <p className="text-center text-lg font-bold"><TL k={title} /></p>
            <div className="flex items-center">
              <LangSwitch className="flex items-center gap-1 text-xs font-bold text-white" />
                <AppearancePanel />
              <CartLink />
            </div>
          </div>
        )}
      </div>

      {/* Wide screens */}
      <div className="mx-auto hidden max-w-6xl items-center gap-8 px-4 py-3 lg:flex">
        <Logo />
        <nav aria-label="Main" className="ml-2 flex items-center gap-6 text-sm font-semibold">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={cn("border-b-2 py-1", active ? "border-accent text-accent" : "border-transparent text-white/80 hover:text-white")}>
                <TL k={l.label} />
              </Link>
            );
          })}
        </nav>
        <SearchForm id="search-desktop" className="ml-auto w-72" />
        <LangSwitch className="flex items-center gap-1 text-xs font-bold text-white" />
                <AppearancePanel />
        <CartLink />
      </div>
    </header>
  );
}
