"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/lib/cart";

/** Parts with no selling price yet can't be bought online; customers ask on WhatsApp instead. */
export function AddToCart({ product }: { product: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const unpriced = product.priceTzs <= 0;
  return (
    <Button
      size="lg"
      disabled={unpriced}
      title={unpriced ? "No price yet: ask us on WhatsApp" : undefined}
      onClick={() => {
        add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? <Check className="h-5 w-5" aria-hidden="true" /> : <ShoppingCart className="h-5 w-5" aria-hidden="true" />}
      {added ? "Added to cart" : "Add to Cart"}
    </Button>
  );
}
