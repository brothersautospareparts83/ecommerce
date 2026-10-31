import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navLinks } from "@/lib/site";

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border text-chrome-fg transition-colors hover:border-accent hover:text-accent";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-chrome-border bg-chrome/95 text-chrome-fg backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-chrome-muted transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/account" aria-label="Account" className={iconBtn}>
              <User className="h-5 w-5" />
            </Link>
            <ThemeToggle className={iconBtn} />
          </div>
          <Link href="/cart" aria-label="Shopping cart" className={iconBtn}>
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
