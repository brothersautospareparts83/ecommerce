import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { asPublic } from "@/lib/db";
import { partsGuide } from "@/lib/parts-guide";

export const metadata: Metadata = {
  title: "Car parts guide",
  description: "The main parts of a car by system, what each one does, and whether we have it in the shop.",
};

type Found = { match: string; n: number; img: string | null; inStock: number };

/** For each guide part: how many published products match, whether any is in stock, and a picture of one. */
async function load(): Promise<Map<string, Found>> {
  const matches = [...new Set(partsGuide.flatMap((s) => s.parts.map((p) => p.match)))];
  const rows = await asPublic(async (db) =>
    (
      await db.query(
        `select m.match,
                count(p.id)::int as n,
                count(p.id) filter (where product_in_stock(p.id))::int as in_stock,
                (array_agg(i.url order by (i.kind = 'illustrative'), i.is_primary desc) filter (where i.url is not null))[1] as img
         from unnest($1::text[]) as m(match)
         left join products p on p.status = 'published' and lower(p.name) like '%' || m.match || '%'
         left join product_images i on i.product_id = p.id and i.verification_status = 'approved'
         group by m.match`,
        [matches],
      )
    ).rows,
  );
  return new Map(rows.map((r) => [r.match as string, { match: r.match, n: r.n, inStock: r.in_stock, img: r.img }]));
}

async function Guide() {
  const found = await load();
  return (
    <div className="space-y-10">
      {partsGuide.map((sys) => (
        <section key={sys.slug} id={sys.slug} className="scroll-mt-24">
          <h2 className="font-display text-xl font-extrabold">{sys.title}</h2>
          <p className="mt-1 text-sm text-muted">{sys.intro}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sys.parts.map((p) => {
              const f = found.get(p.match);
              const have = (f?.n ?? 0) > 0;
              return (
                <article key={p.name} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {f?.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.img} alt={p.name} loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-2 text-muted">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">No photo yet</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold">{p.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{p.what}</p>
                    <p className="mt-2 text-xs">
                      {have ? (
                        <>
                          <Link href={`/shop?q=${encodeURIComponent(p.match)}`} className="font-semibold text-accent-text hover:underline">
                            {f!.n} in our catalogue
                          </Link>
                        </>
                      ) : (
                        <span className="font-semibold text-muted">Not in our catalogue yet: ask us</span>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function PartsGuidePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-extrabold">Car parts guide</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        The main parts of a car, grouped by system, and what each one does. This is general information about part types.
        Whether a part fits your exact vehicle depends on the make, model, year and chassis number, so send us your chassis number
        and we will confirm before you order.
      </p>
      <nav aria-label="Systems" className="mt-4 flex flex-wrap gap-2 text-sm">
        {partsGuide.map((s) => (
          <a key={s.slug} href={`#${s.slug}`} className="rounded-full border border-border px-3 py-1 hover:border-accent">{s.title}</a>
        ))}
      </nav>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading the guide…</p>}>
          <Guide />
        </Suspense>
      </div>
      <div className="mt-10 flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">Can&apos;t find your part, or not sure which one you need? Send us the part name, a photo or your chassis number.</p>
        <div className="flex gap-3">
          <WhatsAppButton />
          <LinkButton href="/finder?mode=vin" variant="secondary">Find by chassis</LinkButton>
        </div>
      </div>
    </div>
  );
}
