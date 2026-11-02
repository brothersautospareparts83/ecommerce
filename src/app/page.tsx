import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Camera, MessageCircle, Search, ShieldCheck, Truck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { publicProducts } from "@/lib/catalog/public";
import { categories } from "@/lib/categories";
import { T } from "@/lib/i18n";
import { site } from "@/lib/site";

const featuredSlugs = ["brake-systems", "engine-components", "suspension-steering", "oil-filters", "electrical-components", "cooling-systems"];
const quick = ["Brake pads", "Oil filter", "Shock absorber", "Spark plug", "Wheel bearing"];

const trust = [
  { icon: Truck, en: "Delivery or pickup", sw: "Usafirishaji au kuchukua" },
  { icon: MessageCircle, en: "Order on WhatsApp", sw: "Agiza kwa WhatsApp" },
  { icon: ShieldCheck, en: "Honest advice", sw: "Ushauri wa kweli" },
];

const steps = [
  { icon: Search, en: "Choose your part", sw: "Chagua kipuri chako", textEn: "Search by name or part number, or open the parts guide.", textSw: "Tafuta kwa jina au namba ya kipuri, au fungua mwongozo wa vipuri." },
  { icon: MessageCircle, en: "Send your order on WhatsApp", sw: "Tuma oda kwa WhatsApp", textEn: "We confirm the price, delivery fee and how to pay.", textSw: "Tunakuthibitishia bei, gharama ya usafirishaji na jinsi ya kulipa." },
  { icon: Camera, en: "Approve a real photo", sw: "Idhinisha picha halisi", textEn: "We check it fits your car and send a photo of your exact part.", textSw: "Tunakagua inafaa gari lako na kukutumia picha ya kipuri chako halisi." },
  { icon: Truck, en: "Delivery or pickup", sw: "Kufikishiwa au kuchukua", textEn: "We deliver, or you collect from the shop in Kariakoo.", textSw: "Tunakufikishia, au unachukua dukani Kariakoo." },
];

async function PopularParts() {
  const { items } = await publicProducts({ sort: "mixed", pageSize: 48 });
  const seen = new Set<string>();
  const shown = items
    .filter((p) => p.imageUrl && p.priceTzs > 0)
    .filter((p) => (seen.has(p.name.toLowerCase()) ? false : (seen.add(p.name.toLowerCase()), true)))
    .slice(0, 8);
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {shown.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function SectionTitle({ children, href, link }: { children: React.ReactNode; href?: string; link?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold sm:text-2xl">{children}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-accent-text">
          {link} <ArrowRight className="inline h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-6 pt-5 sm:space-y-14 sm:pt-8">
      {/* Opening: one clear promise, quick searches, two actions */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          <T en="Kariakoo, Dar es Salaam" sw="Kariakoo, Dar es Salaam" />
        </p>
        <h1 className="max-w-xl text-[1.9rem] font-extrabold leading-[1.1] sm:text-5xl">
          <T en="The right spare part for your car or motorcycle." sw="Kipuri sahihi cha gari au pikipiki yako." />
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-muted sm:text-base">
          <T en="Over 1,500 parts. Send your order on WhatsApp and we confirm the fit with your chassis number." sw="Zaidi ya vipuri 1,500. Tuma oda yako kwa WhatsApp na tunathibitisha inafaa kwa chassis number yako." />
        </p>
        <ul className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {quick.map((q) => (
            <li key={q} className="shrink-0">
              <Link href={`/shop?q=${encodeURIComponent(q)}`} className="block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
                {q}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/shop" size="lg" className="rounded-full"><T en="Shop all parts" sw="Tazama vipuri vyote" /> <ArrowRight className="h-4 w-4" /></LinkButton>
          <WhatsAppButton />
        </div>
        <ul className="mt-6 grid grid-cols-3 gap-2">
          {trust.map(({ icon: Icon, en, sw }) => (
            <li key={en} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-2 px-2 py-3 text-center text-xs font-semibold leading-tight sm:flex-row sm:justify-center sm:gap-2 sm:text-sm">
              <Icon className="h-5 w-5 text-accent-text" aria-hidden="true" />
              <T en={en} sw={sw} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle href="/categories" link={<T en="All" sw="Zote" />}><T en="Shop by category" sw="Nunua kwa kundi" /></SectionTitle>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {featuredSlugs.map((s) => categories.find((c) => c.slug === s)!).map(({ slug, name, icon: Icon }) => (
            <li key={slug}>
              <Link href={`/categories/${slug}`} className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="text-[15px] font-semibold leading-snug">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle href="/shop" link={<T en="View all" sw="Tazama zote" />}><T en="Popular parts" sw="Vipuri maarufu" /></SectionTitle>
        <Suspense fallback={null}>
          <PopularParts />
        </Suspense>
      </section>

      {/* The one dark band on the page */}
      <section className="rounded-3xl bg-hero px-5 py-8 text-hero-fg sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent"><T en="Genuine · OEM · Aftermarket" sw="Halisi · OEM · Aftermarket" /></p>
        <h2 className="mt-3 max-w-lg text-2xl font-bold sm:text-4xl"><T en="Honest advice on every part." sw="Ushauri wa kweli kwa kila kipuri." /></h2>
        <p className="mt-3 max-w-lg text-[15px] text-white/70">
          <T en="We tell you what you are buying, confirm the fit with your chassis number, and send a real photo of your part before delivery." sw="Tunakuambia unachonunua, tunathibitisha inafaa kwa chassis number yako, na kukutumia picha halisi ya kipuri kabla ya kukufikishia." />
        </p>
        <LinkButton href="/finder?mode=vin" size="lg" className="mt-5 rounded-full"><T en="Find parts by chassis" sw="Tafuta kwa chassis" /></LinkButton>
      </section>

      <section>
        <SectionTitle><T en="How ordering works" sw="Jinsi ya kuagiza" /></SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, en, sw, textEn, textSw }, i) => (
            <li key={en} className="flex gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-col">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 font-bold"><Icon className="hidden h-4 w-4 text-accent-text sm:block" aria-hidden="true" /><T en={en} sw={sw} /></h3>
                <p className="mt-1 text-sm text-muted"><T en={textEn} sw={textSw} /></p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-8">
        <h2 className="text-xl font-bold"><T en="Need help finding a part?" sw="Unahitaji msaada kupata kipuri?" /></h2>
        <p className="mt-1 text-sm text-muted"><T en="Send the part name, its number or a photo. We reply on WhatsApp." sw="Tuma jina la kipuri, namba yake au picha. Tunajibu kwa WhatsApp." /></p>
        <p className="mt-3 font-semibold">{site.phones.join("  ·  ")}</p>
        <div className="mt-4 sm:max-w-xs"><WhatsAppButton /></div>
      </section>
    </div>
  );
}
