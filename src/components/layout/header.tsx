import Link from "next/link";
import { CartBadge } from "@/components/cart/cart-badge";
import { SearchForm } from "./search-form";
import { LangSwitch, TL } from "@/lib/i18n";
import { site } from "@/lib/site";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/parts-guide", label: "Parts Guide" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/cart", label: "Cart" },
];

/** Plain header, to be redesigned: name, language switch, links, search. */
export function Header() {
  return (
    <header>
      <p>
        <Link href="/">{site.name}</Link> <LangSwitch className="inline-flex gap-1" />
      </p>
      <nav aria-label="Main">
        <ul>
          {links.map((l) => (
            <li key={l.href} className="inline-block pr-3">
              <Link href={l.href}><TL k={l.label} /></Link>
              {l.href === "/cart" && <CartBadge />}
            </li>
          ))}
        </ul>
      </nav>
      <SearchForm id="search" />
    </header>
  );
}
