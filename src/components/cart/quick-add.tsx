"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { TL } from "@/lib/i18n";
import { useCart, type CartLine } from "@/lib/cart";

/** Small "Add to cart" button for product cards. */
export function QuickAdd({ product }: { product: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-bold text-accent-fg transition-all hover:brightness-110 active:scale-95 sm:w-auto"
    >
      {added ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />}
      {added ? <TL k="Added to cart" /> : <TL k="Add to cart" />}
    </button>
  );
}
