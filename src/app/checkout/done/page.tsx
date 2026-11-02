import { Suspense } from "react";
import { T } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ClearCartOnce } from "@/components/cart/order-done";
import { asPublic } from "@/lib/db";
import { site, whatsappUrl } from "@/lib/site";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

type Tracked = {
  delivery_method: string;
  subtotal_tzs: number;
  items: { name: string; quantity: number; line_total_tzs: number }[];
};

/** Every order is closed with the customer on WhatsApp: this builds the message they send us. */
function orderMessage(ref: string, code: string, o: Tracked | null): string {
  const lines = o?.items.map((i) => `- ${i.quantity} x ${i.name} (${formatTZS(Number(i.line_total_tzs))})`) ?? [];
  return [
    `Hello ${site.shortName}, I placed order ${ref} on your website.`,
    ...(lines.length ? ["", ...lines, "", `Items total: ${formatTZS(Number(o!.subtotal_tzs))}`] : []),
    o ? (o.delivery_method === "pickup" ? "I will collect from the shop." : "Please deliver to me.") : "",
    "",
    `Track: ${site.url}/orders/track?ref=${ref}&code=${code}`,
    "Please confirm availability, the delivery fee and how to pay.",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

async function Receipt({ searchParams }: { searchParams: PageProps<"/checkout/done">["searchParams"] }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" && /^BAS-\d{6}-\d{5}$/.test(sp.ref) ? sp.ref : null;
  const total = typeof sp.total === "string" && /^\d{1,12}$/.test(sp.total) ? Number(sp.total) : null;
  const code = typeof sp.code === "string" && /^[A-Za-z0-9]{8}$/.test(sp.code) ? sp.code.toUpperCase() : null;
  const order: Tracked | null =
    ref && code ? await asPublic(async (db) => (await db.query("select track_order($1, $2) as t", [ref, code])).rows[0].t) : null;
  return (
    <>
      {ref && <p className="mt-4 text-lg"><T en="Order number:" sw="Namba ya oda:" /> <span className="font-bold">{ref}</span></p>}
      {total !== null && <p className="text-muted">Items total: {formatTZS(total)} (delivery, if any, is confirmed with you)</p>}
      {ref && code && (
        <>
          <div className="mt-6 rounded-3xl border-2 border-accent bg-surface p-5 shadow-card">
            <p className="font-semibold"><T en="Last step: send your order to us on WhatsApp" sw="Hatua ya mwisho: tutumie oda yako kwa WhatsApp" /></p>
            <p className="mt-1 text-sm text-muted">We close every order with you on WhatsApp: we confirm the parts, the delivery fee and how you pay. Your order is not final until we reply there.</p>
            <LinkButton href={whatsappUrl(orderMessage(ref, code, order))} variant="whatsapp" size="lg" className="mt-4 w-full rounded-full" target="_blank" rel="noopener noreferrer">
              <T en="Send order on WhatsApp" sw="Tuma oda kwa WhatsApp" />
            </LinkButton>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-surface p-5 text-sm">
            <p><T en="Your tracking code:" sw="Code yako ya kufuatilia:" /> <span className="font-bold">{code}</span></p>
            <p className="mt-1 text-muted">Save it. You need the order number and this code to follow your order and approve the photo of your part.</p>
            <Link href={`/orders/track?ref=${ref}&code=${code}`} className="mt-2 inline-block font-semibold text-accent-text hover:underline"><T en="Track this order" sw="Fuatilia oda hii" /></Link>
          </div>
        </>
      )}
    </>
  );
}

export default function DonePage(props: PageProps<"/checkout/done">) {
  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-8 text-center sm:pt-12">
      <ClearCartOnce />
      <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-[#1fa855]" aria-hidden="true" />
      <h1 className="text-3xl font-extrabold"><T en="Thank you, your order is saved" sw="Asante, oda yako imehifadhiwa" /></h1>
      <Suspense fallback={null}>
        <Receipt searchParams={props.searchParams} />
      </Suspense>
      <p className="mt-4 text-muted"><T en="Before we deliver, we send you a photo of your exact part for you to approve." sw="Kabla hatujakufikishia, tunakutumia picha ya kipuri chako halisi uidhinishe." /></p>
      <LinkButton href="/shop" variant="secondary" className="mt-6 rounded-full"><T en="Continue shopping" sw="Endelea kununua" /></LinkButton>
    </div>
  );
}
