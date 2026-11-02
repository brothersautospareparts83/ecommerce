import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Bike, Headset, LayoutGrid, MapPinned, MessageCircle, ScanSearch, ShieldCheck, Truck, Wrench } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/home/section";
import { PartsFinder } from "@/components/home/parts-finder";
import { AiExpertCard } from "@/components/home/ai-card";
import { Suspense } from "react";
import { LatestProducts } from "@/components/home/product-tabs";
import { publicProducts } from "@/lib/catalog/public";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { categories, vehicleBrands } from "@/lib/categories";
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

const why = [
  { icon: ScanSearch, title: "Smart vehicle matching", sw: "Kulinganisha gari kwa busara", text: "Search by chassis, OEM number, part name or vehicle to find parts that fit.", textSw: "Tafuta kwa chassis, namba ya OEM, jina la kipuri au gari ili kupata vipuri vinavyofaa." },
  { icon: ShieldCheck, title: "Honest advice", sw: "Ushauri wa kweli", text: "Ask us if a part is genuine, OEM equivalent or aftermarket. We tell you straight, and we never pass off one as another.", textSw: "Tuulize kama kipuri ni halisi, OEM au aftermarket. Tunakuambia ukweli, na hatuchanganyi kimoja na kingine." },
  { icon: MapPinned, title: "Based in Kariakoo", sw: "Tuko Kariakoo", text: "A local team in Dar es Salaam you can visit, call or message.", textSw: "Timu ya hapa Dar es Salaam unayoweza kutembelea, kupigia au kuandikia." },
  { icon: Truck, title: "Delivery or pickup", sw: "Usafirishaji au kuchukua", text: "Choose local delivery or collect your order from the shop.", textSw: "Chagua kufikishiwa au kuchukua oda yako dukani." },
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-white text-zinc-900 dark:bg-hero dark:text-hero-fg">
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden opacity-[0.07] dark:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #c4c4c8 0 1px, transparent 1px 22px)",
          }}
        />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        {/* Large screens: the photo sits behind the text */}
        <div className="absolute inset-0 hidden sm:block">
          <Image src="/brand/hero-car-light.webp" alt="" fill sizes="100vw" className="hero-zoom object-cover object-[70%_60%] dark:hidden" />
          <Image src="/brand/hero-car-dark.webp" alt="" fill sizes="100vw" className="hero-zoom hidden object-cover object-[70%_60%] dark:block" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 overflow-hidden dark:block"><div className="hero-sweep h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>
          {/* Shading so the text stays readable over the photo */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent dark:from-black/85 dark:via-black/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-5 px-4 pb-14 pt-0 sm:gap-8 sm:px-6 sm:py-20 lg:py-28">
          <div className="max-w-xl sm:max-w-[58%]">
          <p className="anim-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/60 px-3 py-1 text-xs font-semibold tracking-widest text-zinc-700 dark:border-white/20 dark:bg-transparent dark:text-[#c4c4c8]">
            <Wrench className="h-3.5 w-3.5 text-accent" /> <T en="CARS · MOTORCYCLES · DELIVERY" sw="MAGARI · PIKIPIKI · USAFIRISHAJI" />
          </p>
          <h1 className="anim-fade-up anim-d1 max-w-3xl font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            <T en="QUALITY PARTS." sw="VIPURI BORA." />
            <br />
            <span className="text-accent"><T en="TRUSTED PERFORMANCE." sw="UTENDAJI UNAOAMINIKA." /></span>
          </h1>
          <p className="anim-fade-up anim-d2 mt-4 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-[#c4c4c8] sm:mt-5 sm:text-base">
            <T en="Find the right automotive spare parts with confidence. Discover quality products, smart vehicle matching and reliable service from Brothers Auto Spare Parts." sw="Pata vipuri sahihi vya magari kwa uhakika. Gundua bidhaa bora, ulinganishaji wa gari kwa busara na huduma ya kuaminika kutoka Brothers Auto Spare Parts." />
          </p>
          <div className="anim-fade-up anim-d3 mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <LinkButton href="/shop" size="lg" className="btn-glow col-span-2 gap-2 bg-gradient-to-b from-[#ff9a3c] to-[#f06a00]">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" /> <T en="Explore Spare Parts" sw="Tazama Vipuri" /> <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/finder?mode=vin" variant="outline" size="lg" className="gap-1.5 border-zinc-400 bg-white/80 px-2 text-sm text-zinc-900 hover:bg-white dark:border-white/30 dark:bg-black/40 dark:text-white sm:px-6 sm:text-base">
              <ScanSearch className="h-4 w-4 shrink-0" aria-hidden="true" /> <T en="Find Parts by Chassis" sw="Tafuta kwa Chassis" />
            </LinkButton>
            <WhatsAppButton />
          </div>
          </div>
          {/* Phones: the car gets its own space under the text, so nothing covers it */}
          <div className="relative order-first -mx-4 aspect-[16/10] overflow-hidden sm:hidden">
            <Image src="/brand/hero-car-light.webp" alt="" fill sizes="100vw" className="object-cover object-[75%_55%] dark:hidden" />
            <Image src="/brand/hero-car-dark.webp" alt="" fill sizes="100vw" className="hidden object-cover object-[75%_55%] dark:block" />
          </div>
        </div>
      </section>

      {/* Trust bar, overlapping the bottom of the hero */}
      <section aria-label="Why shop with us" className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6">
        <ul className="grid grid-cols-4 rounded-2xl border border-white/10 bg-hero/95 py-4 text-hero-fg shadow-card backdrop-blur md:grid-cols-5 md:py-5">
          {trust.map(({ icon: Icon, title, sw, text, textSw }, i) => (
            <li key={title} className={`flex flex-col items-center gap-1.5 border-white/10 px-1.5 text-center [&:not(:first-child)]:border-l ${i > 3 ? "hidden md:flex" : ""}`}>
              <Icon className="icon-bob h-7 w-7 text-accent sm:h-8 sm:w-8" strokeWidth={1.6} aria-hidden="true" />
              <p className="text-[11px] font-bold leading-tight sm:text-sm"><T en={title} sw={sw} /></p>
              <p className="hidden text-xs text-[#a8a8ae] md:block"><T en={text} sw={textSw} /></p>
            </li>
          ))}
        </ul>
      </section>

      {/* Parts finder + AI expert */}
      <section className="relative z-10 mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          <PartsFinder />
          <AiExpertCard />
        </div>
      </section>

      <Section eyebrow={<T en="Browse" sw="Vinjari" />} title={<T en="Featured Categories" sw="Makundi Maarufu" />} intro={<T en="Find parts for every vehicle system." sw="Pata vipuri vya kila mfumo wa gari." />}>
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold"><T en="Not sure what your car needs?" sw="Huna uhakika gari lako linahitaji nini?" /></h2>
            <p className="mt-1 text-sm text-muted"><T en="Browse every main part of a car by system, see what it does, and check if we have it." sw="Tazama vipuri vikuu vya gari kwa mfumo, ujue kila kimoja kinafanya nini, na uone kama tunacho." /></p>
          </div>
          <LinkButton href="/parts-guide"><T en="Open the parts guide" sw="Fungua mwongozo wa vipuri" /> <ArrowRight className="h-4 w-4" /></LinkButton>
        </div>
      </section>

      <Suspense fallback={null}>
        <LatestSection />
      </Suspense>


      <Section eyebrow={<T en="Why Brothers" sw="Kwa nini Brothers" />} title={<T en="Why Choose Brothers Auto" sw="Kwa Nini Uchague Brothers Auto" />}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {why.map(({ icon: Icon, title, sw, text, textSw }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-3.5 shadow-card sm:p-6">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-hero text-accent sm:mb-4 sm:h-11 sm:w-11">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <h3 className="font-display text-sm font-bold leading-snug sm:text-base"><T en={title} sw={sw} /></h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm"><T en={text} sw={textSw} /></p>
            </div>
          ))}
        </div>
      </Section>

      <div className="bg-surface-2">
        <Section eyebrow={<T en="Vehicles" sw="Magari" />} title={<T en="Vehicle Brands We Serve" sw="Chapa za Magari Tunazohudumia" />}>
          <ul className="flex flex-wrap gap-2">
            {vehicleBrands.map((b) => (
              <li key={b} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold">
                {b}
              </li>
            ))}
            <li className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted"><T en="and more" sw="na zaidi" /></li>
          </ul>
        </Section>
      </div>


      <div className="bg-surface-2">
        <Section eyebrow={<T en="For the trade" sw="Kwa wafanyabiashara" />} title={<T en="Garage and Wholesale Services" sw="Huduma za Gereji na Jumla" />} intro={<T en="Mechanics, garages, dealers and fleet operators can request bulk quotations and, once approved, trade pricing." sw="Mafundi, gereji, wauzaji na wamiliki wa magari mengi wanaweza kuomba bei za jumla na, wakishaidhinishwa, bei za biashara." />}>
          <LinkButton href="/quotation" size="lg"><T en="Request a Quotation" sw="Omba Bei" /> <ArrowRight className="h-4 w-4" /></LinkButton>
        </Section>
      </div>

      <Section title={<T en="WhatsApp Support" sw="Msaada wa WhatsApp" />} eyebrow={<T en="Talk to us" sw="Ongea nasi" />}>
        <div className="grid items-center gap-6 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8 md:grid-cols-[260px_1fr] md:gap-8">
          <Image
            src="/brand/flyer.webp"
            alt="Brothers Auto Spare Parts flyer: Bora sehemu za gari, with phone 0627 858827 and 0741 939 264"
            width={1024}
            height={1536}
            sizes="260px"
            className="mx-auto hidden h-auto w-full max-w-[260px] rounded-lg md:block"
          />
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <MessageCircle className="mt-1 h-8 w-8 shrink-0 text-accent-text" />
              <p className="max-w-xl text-muted">
                Tupigie au WhatsApp. Send us the part name, OEM number or a photo and our team will help you find the right part.
              </p>
            </div>
            <ul className="space-y-1 font-display text-lg font-extrabold sm:text-xl">
              {site.phones.map((p) => (<li key={p}>{p}</li>))}
            </ul>
            <p className="text-sm text-muted">{site.instagram.handle} · {site.location}</p>
            <WhatsAppButton />
          </div>
        </div>
      </Section>

    </>
  );
}
