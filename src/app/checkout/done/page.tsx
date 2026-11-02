import { Suspense } from "react";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { ClearCartOnce } from "@/components/cart/order-done";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

async function Receipt({ searchParams }: { searchParams: PageProps<"/checkout/done">["searchParams"] }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" && /^BAS-\d{6}-\d{5}$/.test(sp.ref) ? sp.ref : null;
  const total = typeof sp.total === "string" && /^\d{1,12}$/.test(sp.total) ? Number(sp.total) : null;
  return (
    <>
      {ref && <p className="mt-4 text-lg">Order number: <span className="font-bold">{ref}</span></p>}
      {total !== null && <p className="text-muted">Items total: {formatTZS(total)} (delivery, if any, is confirmed with you)</p>}
    </>
  );
}

export default function DonePage(props: PageProps<"/checkout/done">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
      <ClearCartOnce />
      <h1 className="font-display text-2xl font-extrabold">Thank you, your order is received</h1>
      <Suspense fallback={null}>
        <Receipt searchParams={props.searchParams} />
      </Suspense>
      <p className="mt-4 text-muted">We will contact you to confirm the order and arrange payment. Before we deliver, we send you a photo of your exact part for you to approve.</p>
      <LinkButton href="/shop" className="mt-6">Continue shopping</LinkButton>
    </div>
  );
}
