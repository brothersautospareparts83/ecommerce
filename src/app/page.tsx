import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Camera, MessageCircle, Search, ShieldCheck, Truck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/product/product-card";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { publicProducts } from "@/lib/catalog/public";
import { categories } from "@/lib/categories";
import { T } from "@/lib/i18n";
import { site } from "@/lib/site";

const featuredSlugs = ["engine-components", "brake-systems", "suspension-steering", "electrical-components", "cooling-systems", "oil-filters"];

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
    <>
      {/* Hero: light panel with orange slashes and the car, as in the approved design */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--hero-from)] to-[var(--hero-to)] text-[var(--hero-text)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-0 h-full w-28 -skew-x-[22deg] bg-accent/90 m-stripe lg:w-48" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-full w-6 -skew-x-[22deg] bg-[var(--stripe-dark)] m-stripe lg:w-10" style={{ ["--d" as string]: "0.15s" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-2 px-4 pt-6 lg:grid-cols-2 lg:pt-12">
          <div className="pb-2 lg:pb-12">
            <h1 className="m-rise max-w-[16rem] text-[1.7rem] font-extrabold leading-[1.12] sm:max-w-md sm:text-4xl lg:max-w-lg lg:text-5xl">
              <T en="The right spare part for your car or motorcycle." sw="Kipuri sahihi cha gari au pikipiki yako." />
            </h1>
            <p className="tagline m-rise mt-2 text-sm text-[var(--hero-sub)] sm:text-base" style={{ ["--d" as string]: "0.15s" }}>Quality Parts Keep You Moving</p>
            <div className="m-rise mt-4 flex flex-wrap gap-2" style={{ ["--d" as string]: "0.3s" }}>
              <LinkButton href="/shop" size="sm" className="relative overflow-hidden px-4 m-shine"><T en="Shop all parts" sw="Tazama vipuri vyote" /> <ArrowRight className="h-4 w-4" /></LinkButton>
              <WhatsAppButton size="sm" />
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-prado.webp" alt="" width={1536} height={1024} loading="eager" fetchPriority="high" decoding="async" className="m-drive relative mx-auto -mb-1 w-[88%] max-w-xl mix-blend-multiply gold:hidden lg:w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-prado-cutout.webp" alt="" width={1536} height={1024} loading="eager" decoding="async" className="m-drive relative mx-auto -mb-1 hidden w-[88%] max-w-xl gold:block lg:w-full" />
        </div>
      </section>

      {/* Slow ticker of what we sell */}
      <div aria-hidden="true" className="m-ticker-wrap overflow-hidden bg-hero py-2.5 text-hero-fg">
        <div className="m-ticker flex w-max whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em]">
          {[0, 1].map((k) => (
            <span key={k} className="flex shrink-0 items-center">
              {categories.map((c) => (
                <span key={c.slug} className="flex items-center">
                  <span className="px-5">{c.name}</span><span className="text-accent">◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-9 px-4 pb-6 sm:space-y-12">
        {/* Three promises on a white card that overlaps the hero */}
        <ul className="m-rise relative z-10 -mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-surface p-3 shadow-card" style={{ ["--d" as string]: "0.7s" }}>
          {trust.map(({ icon: Icon, en, sw }) => (
            <li key={en} className="flex flex-col items-center gap-1.5 px-1 py-1 text-center text-[11px] font-semibold leading-tight sm:flex-row sm:justify-center sm:gap-3 sm:text-sm">
              <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} aria-hidden="true" />
              <T en={en} sw={sw} />
            </li>
          ))}
        </ul>

        <Reveal stagger>
        <section>
          <SectionTitle href="/categories" link={<T en="See all" sw="Tazama zote" />}><T en="Shop by category" sw="Nunua kwa kundi" /></SectionTitle>
          <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
            {featuredSlugs.map((s) => categories.find((c) => c.slug === s)!).map(({ slug, name, icon: Icon }) => (
              <li key={slug}>
                <Link href={`/categories/${slug}`} className="lift press flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-4 text-center shadow-card">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <span className="text-xs font-semibold leading-snug sm:text-sm">{name.replace(" Components", "").replace(" Systems", "")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        </Reveal>

        <Reveal stagger>
        <section>
          <SectionTitle href="/shop" link={<T en="View all" sw="Tazama zote" />}><T en="Popular parts" sw="Vipuri maarufu" /></SectionTitle>
          <Suspense fallback={null}>
            <PopularParts />
          </Suspense>
        </section>
        </Reveal>

        <Reveal stagger>
        <section>
          <SectionTitle><T en="How ordering works" sw="Jinsi ya kuagiza" /></SectionTitle>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, en, sw, textEn, textSw }, i) => (
              <li key={en} className="lift flex gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-col">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">{i + 1}</span>
                <div>
                  <h3 className="flex items-center gap-2 font-bold"><Icon className="hidden h-4 w-4 text-accent sm:block" aria-hidden="true" /><T en={en} sw={sw} /></h3>
                  <p className="mt-1 text-sm text-muted"><T en={textEn} sw={textSw} /></p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        </Reveal>

        <Reveal>
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <h2 className="text-xl font-bold"><T en="Need help finding a part?" sw="Unahitaji msaada kupata kipuri?" /></h2>
          <p className="mt-1 text-sm text-muted"><T en="Send the part name, its number or a photo. We reply on WhatsApp." sw="Tuma jina la kipuri, namba yake au picha. Tunajibu kwa WhatsApp." /></p>
          <p className="mt-3 font-semibold">{site.phones.join("  ·  ")}</p>
          <div className="mt-4"><WhatsAppButton size="sm" /></div>
        </section>
        </Reveal>
      </div>
    </>
  );
}
