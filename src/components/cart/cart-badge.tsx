"use client";

import { useCart } from "@/lib/cart";

export function CartBadge() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg">
      {count > 99 ? "99+" : count}
    </span>
  );
}
