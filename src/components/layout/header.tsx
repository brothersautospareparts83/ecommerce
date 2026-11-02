import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { CartBadge } from "@/components/cart/cart-badge";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavBar } from "./nav-bar";
import { SearchForm } from "./search-form";
import { TopBar } from "./top-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border text-chrome-fg transition-colors hover:border-accent hover:text-accent";

/**
 * Online-shop header: utility strip, a sticky bar (logo, search, account, theme, cart) and a
 * navigation bar with dropdowns on large screens. On phones the search sits under the logo row
 * and the main navigation lives in the bottom tab bar and the menu drawer.
 */
export function Header() {
  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 border-b border-chrome-border bg-chrome/95 text-chrome-fg shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:gap-8">
          <Logo />
          <SearchForm id="search-desktop" className="hidden max-w-xl flex-1 lg:block" />
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/account" aria-label="Account" className={iconBtn}>
                <User className="h-5 w-5" />
              </Link>
              <ThemeToggle className={iconBtn} />
            </div>
            <Link href="/cart" aria-label="Shopping cart" className={`${iconBtn} relative`}>
              <ShoppingCart className="h-5 w-5" />
              <CartBadge />
            </Link>
            <MobileNav />
          </div>
        </div>
        <div className="px-4 pb-3 sm:px-6 lg:hidden">
          <SearchForm id="search-mobile" />
        </div>
      </header>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
    </>
  );
}
