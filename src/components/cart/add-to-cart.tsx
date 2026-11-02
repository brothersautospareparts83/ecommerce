"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TL } from "@/lib/i18n";
import { useCart, type CartLine } from "@/lib/cart";

/** "Order now": puts the part in the order and goes straight to checkout. Parts with no price yet go through WhatsApp instead. */
export function AddToCart({ product }: { product: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const router = useRouter();
  const unpriced = product.priceTzs <= 0;
  return (
    <Button
      size="lg"
      disabled={unpriced}
      title={unpriced ? "No price yet: ask us on WhatsApp" : undefined}
      onClick={() => {
        add(product);
        router.push("/checkout");
      }}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      <TL k="Order now" />
    </Button>
  );
}
