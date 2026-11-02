import { Suspense } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { asPublic } from "@/lib/db";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { formatTZS } from "@/lib/utils";
import { respondToPhoto } from "./actions";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

const input = "mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm";

type Tracked = {
  reference: string; status: string; payment_status: string; delivery_method: string;
  subtotal_tzs: number; delivery_fee_tzs: number; total_tzs: number; created_at: string;
  items: { name: string; quantity: number; unit_price_tzs: number; line_total_tzs: number }[];
  photos: { id: string; image_url: string; note: string | null; status: "pending" | "approved" | "rejected"; created_at: string }[];
};

async function Result({ searchParams }: { searchParams: PageProps<"/orders/track">["searchParams"] }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref.trim().toUpperCase() : "";
  const code = typeof sp.code === "string" ? sp.code.trim().toUpperCase() : "";
  const lookup = ref && code;
  const order: Tracked | null = lookup
    ? await asPublic(async (db) => (await db.query("select track_order($1, $2) as t", [ref, code])).rows[0].t)
    : null;

  return (
    <>
      <form method="get" className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-semibold">Order number<input name="ref" defaultValue={ref} placeholder="BAS-261102-00001" required className={input} /></label>
        <label className="text-sm font-semibold">Tracking code<input name="code" defaultValue={code} placeholder="8 letters or numbers" required className={input} /></label>
        <Button type="submit" size="lg">Track</Button>
      </form>
      {lookup && !order && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">We could not find that order. Check the order number and tracking code from your confirmation.</p>}
      {order && (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-extrabold">{order.reference}</h2>
            <p className="text-sm text-muted">Placed {formatDate(order.created_at)} · {order.delivery_method === "pickup" ? "Collect from the shop" : "Delivery"}</p>
            <p className="mt-2"><span className="font-semibold">Status:</span> {orderStatusLabel[order.status] ?? order.status} · {order.payment_status === "paid" ? "Paid" : "Payment not yet received"}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((i) => <li key={i.name} className="flex justify-between gap-3"><span>{i.quantity} × {i.name}</span><span>{formatTZS(Number(i.line_total_tzs))}</span></li>)}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <p className="flex justify-between"><span>Items</span><span>{formatTZS(Number(order.subtotal_tzs))}</span></p>
              <p className="flex justify-between"><span>Delivery</span><span>{formatTZS(Number(order.delivery_fee_tzs))}</span></p>
              <p className="flex justify-between font-bold"><span>Total</span><span>{formatTZS(Number(order.total_tzs))}</span></p>
            </div>
          </section>

          {order.photos.length > 0 && (
            <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-extrabold">Photo of your exact part</h2>
              <p className="text-sm text-muted">This is a real photo of the part we will deliver. Please check it before we send it.</p>
              {order.photos.map((p) => (
                <div key={p.id} className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt="Photo of your part" className="max-h-96 w-full rounded-lg border border-border object-contain" />
                  {p.note && <p className="text-sm">{p.note}</p>}
                  {p.status === "pending" ? (
                    <form action={respondToPhoto} className="space-y-2">
                      <input type="hidden" name="ref" value={order.reference} />
                      <input type="hidden" name="code" value={code} />
                      <input type="hidden" name="photoId" value={p.id} />
                      <input name="comment" placeholder="Comment (optional)" className={input} />
                      <div className="flex gap-3">
                        <Button type="submit" name="decision" value="approve">This is the right part</Button>
                        <Button type="submit" name="decision" value="reject" variant="secondary">It is not right</Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm font-semibold">{p.status === "approved" ? "You approved this photo." : "You rejected this photo. We will contact you."}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}

export default function TrackPage(props: PageProps<"/orders/track">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold">Track your order</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
        <Result searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
