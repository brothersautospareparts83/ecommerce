import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { ActionForm } from "@/components/admin/action-form";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { site } from "@/lib/site";
import { formatTZS } from "@/lib/utils";
import { addPhotoCheck, markPaid, setDeliveryFee, setOrderStatus } from "../actions";

export const metadata = { title: "Order" };

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm";

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const me = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withDb(staffSession(me), async (db) => {
    const o = (await db.query("select * from orders where id = $1", [id])).rows[0];
    if (!o) return null;
    const items = (await db.query("select * from order_items where order_id = $1 order by product_name", [id])).rows;
    const photos = (await db.query("select * from order_photo_checks where order_id = $1 order by created_at desc", [id])).rows;
    const history = (await db.query("select from_status, to_status, created_at from order_status_history where order_id = $1 order by created_at", [id])).rows;
    return { o, items, photos, history };
  });
  if (!data) notFound();
  const { o, items, photos, history } = data;
  const trackUrl = `${site.url}/orders/track?ref=${encodeURIComponent(o.reference)}&code=${encodeURIComponent(o.tracking_code)}`;
  const waText = `Hello ${o.customer_name}, your order ${o.reference} at Brothers Auto Spare Parts: ${trackUrl}`;
  const phoneDigits = String(o.phone).replace(/\D/g, "");
  const addr = o.delivery_address as { region?: string; address?: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-muted hover:text-fg">← All orders</Link>
        <h1 className="font-display text-2xl font-extrabold">{o.reference}</h1>
        <p className="text-sm text-muted">Placed {formatDate(o.created_at)} · {orderStatusLabel[o.status]} · {o.payment_status === "paid" ? "Paid" : "Not paid"}</p>
      </div>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">Customer</h2>
          <p>{o.customer_name}</p>
          <p className="text-sm text-muted">{o.phone}{o.email ? ` · ${o.email}` : ""}</p>
          <p className="mt-2 text-sm">{o.delivery_method === "pickup" ? "Collects from the shop" : `Delivery: ${[addr?.region, addr?.address].filter(Boolean).join(", ")}`}</p>
          {o.notes && <p className="mt-2 text-sm"><span className="font-semibold">Notes:</span> {o.notes}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold">Customer link</h2>
          <p className="break-all text-muted">{trackUrl}</p>
          <a href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-text hover:underline">Send on WhatsApp</a>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted"><tr><th className="p-3">Part</th><th className="p-3">Qty</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-border bg-surface">
            {items.map((i) => (
              <tr key={i.id}><td className="p-3">{i.product_name}<div className="text-xs text-muted">SKU {i.sku}</div></td><td className="p-3">{i.quantity}</td><td className="p-3 text-right">{formatTZS(Number(i.unit_price_tzs))}</td><td className="p-3 text-right">{formatTZS(Number(i.line_total_tzs))}</td></tr>
            ))}
          </tbody>
          <tfoot className="bg-surface text-sm">
            <tr><td className="p-3 text-right" colSpan={3}>Items</td><td className="p-3 text-right">{formatTZS(Number(o.subtotal_tzs))}</td></tr>
            <tr><td className="p-3 text-right" colSpan={3}>Delivery</td><td className="p-3 text-right">{formatTZS(Number(o.delivery_fee_tzs))}</td></tr>
            <tr className="font-bold"><td className="p-3 text-right" colSpan={3}>Total</td><td className="p-3 text-right">{formatTZS(Number(o.total_tzs))}</td></tr>
          </tfoot>
        </table>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Status</h2>
          <ActionForm action={setOrderStatus} submitLabel="Update status">
            <input type="hidden" name="orderId" value={o.id} />
            <select name="status" defaultValue={o.status} className={input}>
              {Object.entries(orderStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </ActionForm>
          <p className="text-xs text-muted">Confirming deducts stock. Ready for pickup, shipped and delivered need the customer to approve a photo first. Cancelling a confirmed order returns the stock.</p>
          {o.delivery_method === "delivery" && (
            <ActionForm action={setDeliveryFee} submitLabel="Save delivery fee" variant="secondary">
              <input type="hidden" name="orderId" value={o.id} />
              <label className="block text-sm font-semibold">Delivery fee (TSh)<input name="fee" type="number" min={0} step={1} defaultValue={Number(o.delivery_fee_tzs)} className={input} /></label>
            </ActionForm>
          )}
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Payment</h2>
          {o.payment_status === "paid" ? (
            <p className="text-sm">Payment received and recorded.</p>
          ) : (
            <ActionForm action={markPaid} submitLabel="Record payment received" variant="secondary">
              <input type="hidden" name="orderId" value={o.id} />
              <select name="method" className={input} defaultValue="mobile_money">
                <option value="mobile_money">Mobile money</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option>
              </select>
              <input name="reference" placeholder="Transaction reference (optional)" className={input} />
              <p className="text-xs text-muted">Only record this after you have checked that the money arrived for the full total.</p>
            </ActionForm>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Photo of the exact part (customer approval)</h2>
        <p className="text-sm text-muted">Take a real photo of the part you will deliver, put it online, and paste its https address here. The customer sees it with their link and approves or rejects it.</p>
        <ActionForm action={addPhotoCheck} submitLabel="Send photo to customer">
          <input type="hidden" name="orderId" value={o.id} />
          <input name="imageUrl" placeholder="https://… photo address" className={input} required />
          <input name="note" placeholder="Note for the customer (optional)" className={input} />
        </ActionForm>
        {photos.length > 0 && (
          <ul className="space-y-3">
            {photos.map((p) => (
              <li key={p.id} className="flex gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt="Part photo sent to the customer" className="h-20 w-20 rounded-lg border border-border object-cover" />
                <div>
                  <p className="font-semibold">{p.status === "approved" ? "Approved by customer" : p.status === "rejected" ? "Rejected by customer" : "Waiting for customer"}</p>
                  {p.note && <p className="text-muted">{p.note}</p>}
                  {p.customer_comment && <p>“{p.customer_comment}”</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">History</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {history.map((h, i) => <li key={i}>{formatDate(h.created_at)}: {h.from_status ? `${orderStatusLabel[h.from_status]} → ` : ""}{orderStatusLabel[h.to_status]}</li>)}
        </ul>
      </section>
    </div>
  );
}
