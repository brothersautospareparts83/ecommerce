import Link from "next/link";
import { ArrowRight, ShoppingCart, Bike, Headset, LayoutGrid, MessageCircle, ScanSearch, ShieldCheck, Truck, Wrench, Search, Camera } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/home/section";
import { PartsFinder } from "@/components/home/parts-finder";
import { Suspense } from "react";
import { LatestProducts } from "@/components/home/product-tabs";
import { publicProducts } from "@/lib/catalog/public";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { categories } from "@/lib/categories";
import { site } from "@/lib/site";
import { T } from "@/lib/i18n";

const featuredSlugs = ["engine-components", "brake-systems", "suspension-steering", "oil-filters", "electrical-components"];

const trust = [
  { icon: Truck, title: "Delivery or pickup", sw: "Usafirishaji au kuchukua", text: "Across Tanzania or from Kariakoo", textSw: "Nchi nzima au kutoka Kariakoo" },
  { icon: MessageCircle, title: "Order on WhatsApp", sw: "Agiza kwa WhatsApp", text: "Send a part name or number", textSw: "Tuma jina au namba ya kipuri" },
  { icon: Headset, title: "Expert support", sw: "Msaada wa wataalamu", text: site.phones[0], textSw: site.phones[0] },
  { icon: Bike, title: "Cars & motorcycles", sw: "Magari na pikipiki", text: "Parts for both", textSw: "Vipuri vya vyote viwili" },
  { icon: ShieldCheck, title: "Honest advice", sw: "Ushauri wa kweli", text: "We tell you what you are buying", textSw: "Tunakuambia unachonunua" },
];

const steps = [
  { icon: Search, title: "Find your part", sw: "Tafuta kipuri chako", text: "Search by name or part number, or open the parts guide.", textSw: "Tafuta kwa jina au namba ya kipuri, au fungua mwongozo wa vipuri." },
  { icon: MessageCircle, title: "Send your order on WhatsApp", sw: "Tuma oda kwa WhatsApp", text: "We confirm the price, delivery fee and how to pay.", textSw: "Tunakuthibitishia bei, gharama ya usafirishaji na jinsi ya kulipa." },
  { icon: Camera, title: "Check the fit and the photo", sw: "Hakiki inafaa na picha", text: "We check it fits your car, and send a real photo of your part to approve.", textSw: "Tunakagua inafaa gari lako, na kukutumia picha halisi ya kipuri uidhinishe." },
  { icon: Truck, title: "Delivery or pickup", sw: "Kufikishiwa au kuchukua", text: "We deliver, or you collect from the shop in Kariakoo.", textSw: "Tunakufikishia, au unachukua dukani Kariakoo." },
];

async function LatestSection() {
  // Parts that have a picture and a price look best on the home page.
  const { items } = await publicProducts({ sort: "mixed", pageSize: 48 });
  // One of each kind of part, so the row shows variety instead of eight of the same thing.
  const seen = new Set<string>();
  const shown = items
    .filter((p) => p.imageUrl && p.priceTzs > 0)
    .filter((p) => (seen.has(p.name.toLowerCase()) ? false : (seen.add(p.name.toLowerCase()), true)))
    .slice(0, 8);
  return <LatestProducts products={shown} />;
}

export default function HomePage() {
  return (
    <>
      {/* 1. Find a part: first thing on the page */}
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <PartsFinder />
      </section>

      <Section title={<T en="Shop by category" sw="Nunua kwa kundi" />}>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {featuredSlugs.map((s) => categories.find((c) => c.slug === s)!).map(({ slug, name, icon: Icon }) => (
            <Link
              key={slug}
              href={`/categories/${slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-2 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-card"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent-text transition-colors group-hover:bg-accent group-hover:text-accent-fg sm:h-16 sm:w-16">
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="font-display text-xs font-bold leading-snug sm:text-sm">{name}</span>
            </Link>
          ))}
          <Link
            href="/categories"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-accent px-2 py-5 text-center text-accent-fg transition-transform hover:-translate-y-1"
          >
            <LayoutGrid className="h-8 w-8" aria-hidden="true" />
            <span className="font-display text-xs font-extrabold leading-snug sm:text-sm"><T en="View All Categories →" sw="Tazama Makundi Yote →" /></span>
          </Link>
        </div>
      </Section>

      <Suspense fallback={null}>
        <LatestSection />
      </Suspense>

      {/* 4. Banner */}
      <section className="relative overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-hero-fg">
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden opacity-[0.07] dark:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #c4c4c8 0 1px, transparent 1px 22px)",
          }}
        />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        {/* The photo is shown whole, never cropped or zoomed: centred on large screens, along the bottom on phones.
            The files are served as they are (already web-sized), so they appear straight away. */}
        <div className="absolute inset-x-0 bottom-12 aspect-[16/9] sm:inset-x-auto sm:bottom-0 sm:left-1/2 sm:top-0 sm:h-full sm:w-auto sm:-translate-x-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-car-light.webp" srcSet="/brand/hero-car-light-800.webp 800w, /brand/hero-car-light.webp 1672w" sizes="(max-width: 640px) 100vw, 1100px" alt="" width={1672} height={941} loading="eager" fetchPriority="high" decoding="async" className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] absolute inset-0 hero-drift h-full w-full object-cover dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-car-dark.webp" srcSet="/brand/hero-car-dark-800.webp 800w, /brand/hero-car-dark.webp 1672w" sizes="(max-width: 640px) 100vw, 1100px" alt="" width={1672} height={941} loading="lazy" decoding="async" className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] absolute inset-0 hero-drift h-full w-full object-cover hidden dark:block" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-5 px-4 pb-[calc(40vw+3rem)] pt-8 sm:min-h-[460px] sm:gap-8 sm:px-6 sm:pb-20 sm:pt-20 lg:min-h-[540px] lg:py-24">
          <div className="max-w-xl sm:max-w-[44%]">
          <p className="anim-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/60 px-3 py-1 text-xs font-medium tracking-wide text-zinc-700 dark:border-white/20 dark:bg-transparent dark:text-[#c4c4c8]">
            <Wrench className="h-3.5 w-3.5 text-accent" /> <T en="Cars · Motorcycles · Delivery" sw="Magari · Pikipiki · Usafirishaji" />
          </p>
          <h1 className="anim-fade-up anim-d1 max-w-3xl font-display text-[1.9rem] font-bold leading-[1.12] tracking-tight sm:text-5xl">
            <T en="Quality parts." sw="Vipuri bora." />
            <br />
            <span className="text-accent"><T en="Trusted performance." sw="Utendaji unaoaminika." /></span>
          </h1>
          <p className="anim-fade-up anim-d2 mt-4 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-[#c4c4c8] sm:mt-5 sm:text-base">
            <T en="Find the right automotive spare parts with confidence. Discover quality products, smart vehicle matching and reliable service from Brothers Auto Spare Parts." sw="Pata vipuri sahihi vya magari kwa uhakika. Gundua bidhaa bora, ulinganishaji wa gari kwa busara na huduma ya kuaminika kutoka Brothers Auto Spare Parts." />
          </p>
          <div className="anim-fade-up anim-d3 mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <LinkButton href="/shop" size="lg" className="col-span-2 gap-2">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" /> <T en="Explore Spare Parts" sw="Tazama Vipuri" /> <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/finder?mode=vin" variant="outline" size="lg" className="gap-1.5 border-zinc-400 bg-white/80 px-2 text-sm text-zinc-900 hover:bg-white dark:border-white/30 dark:bg-black/40 dark:text-white sm:px-6 sm:text-base">
              <ScanSearch className="h-4 w-4 shrink-0" aria-hidden="true" /> <T en="Find Parts by Chassis" sw="Tafuta kwa Chassis" />
            </LinkButton>
            <WhatsAppButton />
          </div>
          </div>
        </div>
      </section>

      {/* Trust bar, overlapping the bottom of the hero */}
      <section aria-label="Why shop with us" className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6">
        <ul className="grid grid-cols-4 rounded-2xl border border-border bg-surface/95 py-4 text-fg shadow-xl backdrop-blur dark:border-white/10 dark:bg-hero/95 dark:text-hero-fg md:grid-cols-5 md:py-5">
          {trust.map(({ icon: Icon, title, sw, text, textSw }, i) => (
            <li key={title} className={`flex flex-col items-center gap-1.5 border-border px-1.5 text-center dark:border-white/10 [&:not(:first-child)]:border-l ${i > 3 ? "hidden md:flex" : ""}`}>
              <Icon className="h-7 w-7 text-accent sm:h-8 sm:w-8" strokeWidth={1.6} aria-hidden="true" />
              <p className="text-[11px] font-bold leading-tight sm:text-sm"><T en={title} sw={sw} /></p>
              <p className="hidden text-xs text-muted md:block"><T en={text} sw={textSw} /></p>
            </li>
          ))}
        </ul>
      </section>

      <Section eyebrow={<T en="How it works" sw="Jinsi inavyofanya kazi" />} title={<T en="Order in four easy steps" sw="Agiza kwa hatua nne rahisi" />}>
        <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, sw, text, textSw }, i) => (
            <li key={title} className="rounded-xl border border-border bg-surface p-4 shadow-card">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent-text dark:bg-hero dark:text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <p className="text-xs font-bold text-accent-text">{i + 1}</p>
              <h3 className="font-display text-sm font-bold leading-snug"><T en={title} sw={sw} /></h3>
              <p className="mt-1 text-xs leading-relaxed text-muted"><T en={text} sw={textSw} /></p>
            </li>
          ))}
        </ol>
      </Section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 text-fg shadow-card sm:p-8 dark:border-white/10 dark:from-hero dark:to-hero dark:text-hero-fg">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-20 h-20 w-[70%] -skew-y-[12deg] bg-gradient-to-l from-accent/60 via-accent/20 to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold"><T en="Need help finding a part?" sw="Unahitaji msaada kupata kipuri?" /></h2>
              <p className="mt-1 text-sm text-muted"><T en="Call or message us. Send the part name, its number or a photo." sw="Tupigie au tuandikie. Tuma jina la kipuri, namba yake au picha." /></p>
              <p className="mt-3 font-display text-lg font-extrabold">{site.phones.join("  ·  ")}</p>
              <p className="text-xs text-muted">{site.location}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <WhatsAppButton />
              <LinkButton href="/about" variant="outline" size="lg" className="border-zinc-300 text-zinc-900 hover:bg-zinc-100 dark:border-white/40 dark:text-white dark:hover:bg-white/10"><T en="About us" sw="Kuhusu sisi" /></LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
