"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Menu, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/account", label: "Account", icon: User },
];

const base = "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors";

/** Thumb-reach navigation for phones and small tablets. "More" opens the menu drawer. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-chrome-border bg-chrome pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(base, active ? "text-accent" : "text-chrome-muted hover:text-chrome-fg")}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-menu"))}
            className={cn(base, "cursor-pointer text-chrome-muted hover:text-chrome-fg")}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
