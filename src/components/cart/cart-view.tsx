"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatTZS } from "@/lib/utils";

export function CartView() {
  const { lines, ready, subtotalTzs, setQuantity, remove } = useCart();
  if (!ready) return <p className="mt-6 text-muted">Loading your cart…</p>;
  if (lines.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <LinkButton href="/shop" className="mt-4">Browse parts</LinkButton>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {lines.map((l) => (
          <li key={l.productId} className="flex gap-4 p-4">
            <Link href={`/products/${l.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
              <ProductImage src={l.imageUrl} alt={l.name} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${l.slug}`} className="font-semibold hover:underline">{l.name}</Link>
              <p className="text-xs text-muted">SKU {l.sku}</p>
              <p className="mt-1 text-sm">{formatTZS(l.priceTzs)} each</p>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="secondary" size="icon" aria-label="Decrease quantity" onClick={() => setQuantity(l.productId, l.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                <span className="w-8 text-center font-semibold" aria-live="polite">{l.quantity}</span>
                <Button variant="secondary" size="icon" aria-label="Increase quantity" onClick={() => setQuantity(l.productId, l.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`Remove ${l.name}`} onClick={() => remove(l.productId)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="font-display font-extrabold">{formatTZS(l.priceTzs * l.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex justify-between text-lg font-bold"><span>Subtotal</span><span>{formatTZS(subtotalTzs)}</span></div>
        <p className="mt-1 text-sm text-muted">Delivery is charged separately and confirmed with you. Prices are checked again when you place the order.</p>
        <LinkButton href="/checkout" size="lg" className="mt-4 w-full">Checkout</LinkButton>
      </div>
    </div>
  );
}
