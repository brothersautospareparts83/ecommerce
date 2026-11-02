"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { Button, LinkButton } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatTZS } from "@/lib/utils";

const field = "mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm";

export function CheckoutForm() {
  const { lines, ready, subtotalTzs } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");

  if (!ready) return <p className="mt-6 text-muted">Loading…</p>;
  if (lines.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <LinkButton href="/shop" className="mt-4">Browse parts</LinkButton>
      </div>
    );
  }
  const items = JSON.stringify(lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })));
  return (
    <form action={action} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="items" value={items} />
      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <label className="block text-sm font-semibold">Full name<input name="name" required autoComplete="name" className={field} /></label>
        <label className="block text-sm font-semibold">Phone (WhatsApp if possible)<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={field} /></label>
        <label className="block text-sm font-semibold">Email (optional)<input name="email" type="email" autoComplete="email" className={field} /></label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">How do you want to get it?</legend>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="method" value="pickup" checked={method === "pickup"} onChange={() => setMethod("pickup")} /> Collect from the shop (Kariakoo)</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="method" value="delivery" checked={method === "delivery"} onChange={() => setMethod("delivery")} /> Delivery (fee confirmed with you)</label>
        </fieldset>
        {method === "delivery" && (
          <>
            <label className="block text-sm font-semibold">Region / city<input name="region" autoComplete="address-level1" className={field} /></label>
            <label className="block text-sm font-semibold">Delivery address<textarea name="address" required rows={3} autoComplete="street-address" className={`${field} h-auto py-2`} /></label>
          </>
        )}
        <label className="block text-sm font-semibold">Vehicle or notes (optional)<textarea name="notes" rows={2} placeholder="e.g. Toyota Hilux 2016, chassis number" className={`${field} h-auto py-2`} /></label>
      </div>
      <aside className="space-y-3 self-start rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-extrabold">Order summary</h2>
        <ul className="space-y-1 text-sm">
          {lines.map((l) => <li key={l.productId} className="flex justify-between gap-3"><span className="truncate">{l.quantity} × {l.name}</span><span>{formatTZS(l.priceTzs * l.quantity)}</span></li>)}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 font-bold"><span>Subtotal</span><span>{formatTZS(subtotalTzs)}</span></div>
        <p className="text-xs text-muted">Payment is arranged after we confirm your order: we will contact you. Before delivery we send you a photo of your exact part for you to approve. Prices are checked again when you place the order.</p>
        {state.error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Placing order…" : "Place order"}</Button>
      </aside>
    </form>
  );
}
