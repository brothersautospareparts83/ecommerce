"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, LayoutGrid, Phone, ShoppingBag } from "lucide-react";
import { TL } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: LayoutGrid },
  { href: "/parts-guide", label: "Guide", icon: BookOpen },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/contact", label: "Contact", icon: Phone },
];

/** Thumb-reach navigation on phones and small tablets. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-accent-text" : "text-muted")}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <TL k={label} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
