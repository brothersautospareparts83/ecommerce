"use client";

import { useRouter } from "next/navigation";
import { TL } from "@/lib/i18n";
import { useCart, type CartLine } from "@/lib/cart";

/** "Order now" on a product card: puts the part in the order and goes straight to checkout. */
export function QuickAdd({ product }: { product: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        router.push("/checkout");
      }}
      className="inline-flex h-8 w-full items-center justify-center rounded-full bg-accent px-3 text-xs font-bold text-accent-fg transition-all hover:brightness-110 active:scale-95 sm:w-auto"
    >
      <TL k="Order now" />
    </button>
  );
}
