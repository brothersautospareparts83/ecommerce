import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { toIntl } from "@/lib/site";
import { setInquiryStatus } from "./actions";

export const metadata: Metadata = { title: "Inquiries" };

async function List() {
  const me = await requireStaff();
  const rows = await withDb(staffSession(me), async (db) =>
    (await db.query("select id, name, phone, email, message, status, created_at from inquiries order by (status = 'new') desc, created_at desc limit 200")).rows,
  );
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Inquiries</h1>
      <p className="text-sm text-muted">Questions sent from the Contact page. Reply by phone or WhatsApp, then mark them handled.</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">No inquiries yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name} <span className="text-xs font-normal text-muted">· {formatDate(r.created_at)}</span></p>
                  <p className="text-sm text-muted">
                    <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>
                    {r.email && <> · <a href={`mailto:${r.email}`} className="underline">{r.email}</a></>}
                  </p>
                </div>
                <span className={r.status === "new" ? "rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-text" : "rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted"}>
                  {r.status === "new" ? "New" : "Handled"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{r.message}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a
                  href={`https://wa.me/${toIntl(String(r.phone).replace("+", ""))}?text=${encodeURIComponent("Hello " + r.name + ", this is Brothers Auto Spare Parts replying to your question.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-3 py-1.5 font-semibold hover:border-accent"
                >
                  WhatsApp
                </a>
                <form action={setInquiryStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "new" ? "handled" : "new"} />
                  <button type="submit" className="cursor-pointer rounded-lg border border-border px-3 py-1.5 font-semibold hover:border-accent">
                    {r.status === "new" ? "Mark handled" : "Mark new"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InquiriesPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <List />
    </Suspense>
  );
}
