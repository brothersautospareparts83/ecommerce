import Link from "next/link";
import { categories } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Row of category shortcuts with icons. Scrolls sideways on phones. */
export function CategoryBar({ active }: { active?: string }) {
  return (
    <nav aria-label="Categories" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 rounded-xl border border-border bg-surface p-2 sm:min-w-0 sm:flex-wrap">
        {categories.map(({ slug, name, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={`/shop?category=${slug}`}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                active === slug ? "bg-accent text-accent-fg" : "hover:bg-surface-2",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {name.replace(" Components", "").replace(" Systems", "")}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
