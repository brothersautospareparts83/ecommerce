"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { Button, LinkButton } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { T, TL } from "@/lib/i18n";
import { formatTZS } from "@/lib/utils";

const field = "mt-1.5 h-12 w-full min-w-0 rounded-xl border border-border bg-bg px-3.5 text-[15px] outline-none focus:border-accent focus:bg-surface";

export function CheckoutForm() {
  const { lines, ready, subtotalTzs } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");

  if (!ready) return <p className="mt-6 text-muted"><T en="Loading…" sw="Inapakia…" /></p>;
  if (lines.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="text-muted"><T en="Your cart is empty." sw="Kikapu chako ni tupu." /></p>
        <LinkButton href="/shop" className="mt-4 rounded-full"><T en="Browse parts" sw="Tazama vipuri" /></LinkButton>
      </div>
    );
  }
  const items = JSON.stringify(lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })));
  return (
    <form action={action} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="items" value={items} />
      <div className="min-w-0 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <label className="block text-sm font-semibold"><TL k="Full name" /><input name="name" required autoComplete="name" className={field} /></label>
        <label className="block text-sm font-semibold"><TL k="Phone (WhatsApp if possible)" /><input name="phone" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={field} /></label>
        <label className="block text-sm font-semibold"><TL k="Email (optional)" /><input name="email" type="email" autoComplete="email" className={field} /></label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold"><TL k="How do you want to get it?" /></legend>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"><input type="radio" name="method" value="pickup" className="accent-[#1c3d2e]" checked={method === "pickup"} onChange={() => setMethod("pickup")} /> <TL k="Collect from the shop (Kariakoo)" /></label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"><input type="radio" name="method" value="delivery" className="accent-[#1c3d2e]" checked={method === "delivery"} onChange={() => setMethod("delivery")} /> <TL k="Delivery (fee confirmed with you)" /></label>
        </fieldset>
        {method === "delivery" && (
          <>
            <label className="block text-sm font-semibold"><TL k="Region / city" /><input name="region" autoComplete="address-level1" className={field} /></label>
            <label className="block text-sm font-semibold"><TL k="Delivery address" /><textarea name="address" required rows={3} autoComplete="street-address" className={`${field} h-auto py-2`} /></label>
          </>
        )}
        <label className="block text-sm font-semibold"><TL k="Vehicle or notes (optional)" /><textarea name="notes" rows={2} placeholder="e.g. Toyota Hilux 2016, chassis number" className={`${field} h-auto py-2`} /></label>
      </div>
      <aside className="min-w-0 space-y-3 self-start rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-extrabold"><TL k="Order summary" /></h2>
        <ul className="space-y-1 text-sm">
          {lines.map((l) => <li key={l.productId} className="flex justify-between gap-3"><span className="truncate">{l.quantity} × {l.name}</span><span>{formatTZS(l.priceTzs * l.quantity)}</span></li>)}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 font-bold"><span><TL k="Subtotal" /></span><span>{formatTZS(subtotalTzs)}</span></div>
        <p className="text-xs text-muted"><T en="Next you send your order to us on WhatsApp. We close every order there: we confirm the parts, delivery fee and payment. Before delivery we send you a photo of your exact part for you to approve. Prices are checked again when you place the order." sw="Kisha unatutumia oda yako kwa WhatsApp. Tunakamilisha kila oda huko: tunathibitisha vipuri, gharama ya usafirishaji na malipo. Kabla ya kukufikishia tunakutumia picha ya kipuri chako halisi uidhinishe. Bei hukaguliwa tena unapoweka oda." /></p>
        {state.error && <p role="alert" className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={pending}><TL k={pending ? "Saving your order…" : "Place order, then send on WhatsApp"} /></Button>
      </aside>
    </form>
  );
}
