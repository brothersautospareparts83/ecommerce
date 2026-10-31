import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPinned, MessageCircle, ScanSearch, ShieldCheck, Sparkles, Star, Truck, Wrench } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/home/section";
import { PartsFinder } from "@/components/home/parts-finder";
import { ProductTabs } from "@/components/home/product-tabs";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { categories, products, vehicleBrands } from "@/lib/demo-data";
import { site } from "@/lib/site";

const why = [
  { icon: ScanSearch, title: "Smart vehicle matching", text: "Search by chassis, OEM number, part name or vehicle to find parts that fit." },
  { icon: ShieldCheck, title: "Honest classification", text: "Every part is labelled Genuine OEM, OEM equivalent or Aftermarket. Never blurred." },
  { icon: MapPinned, title: "Based in Kariakoo", text: "A local team in Dar es Salaam you can visit, call or message." },
  { icon: Truck, title: "Delivery or pickup", text: "Choose local delivery or collect your order from the shop." },
];

const types = [
  { name: "Genuine OEM", text: "Made by or for the vehicle manufacturer, to original specification." },
  { name: "OEM equivalent", text: "Built to match original specifications by an established manufacturer." },
  { name: "Aftermarket", text: "Independently produced replacements, often at a lower price." },
];

export default function HomePage() {
  const tabs = [
    { id: "popular", label: "Popular", products: products.slice(0, 4) },
    { id: "best", label: "Best Sellers", products: products.slice(4, 8) },
    { id: "new", label: "New Arrivals", products: products.slice(8, 12) },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-hero-fg">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #c0c7d1 0 1px, transparent 1px 22px)",
          }}
        />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-widest text-[#c0c7d1]">
            <Wrench className="h-3.5 w-3.5 text-accent" /> CARS · MOTORCYCLES · DELIVERY
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            QUALITY PARTS.
            <br />
            <span className="text-accent">TRUSTED PERFORMANCE.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#c0c7d1] sm:text-lg">
            Find the right automotive spare parts with confidence. Discover quality products, smart vehicle
            matching and reliable service from Brothers Auto Spare Parts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/shop" size="lg">
              Explore Spare Parts <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/finder?mode=vin" variant="outline" size="lg">
              Find Parts by Chassis
            </LinkButton>
            <WhatsAppButton />
          </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <Image
              src="/brand/logo-full-800.webp"
              alt="Brothers Auto Spare Parts logo: winged shield with crossed pistons"
              width={800}
              height={800}
              priority
              sizes="(min-width: 1024px) 480px, 80vw"
              className="mx-auto h-auto w-full max-w-[460px] mix-blend-screen"
            />
          </div>
        </div>
      </section>

      {/* Parts finder */}
      <section className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 sm:px-6">
        <PartsFinder />
      </section>

      <Section eyebrow="Browse" title="Featured Categories">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map(({ slug, name, icon: Icon }) => (
            <Link
              key={slug}
              href={`/categories/${slug}`}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-accent-text transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display text-sm font-bold leading-snug">{name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Products"
        title="Popular, Best Sellers & New Arrivals"
        intro="Layout preview using clearly marked DEMO records. Real listings, prices and sales rankings appear once your catalog is imported."
        className="pt-0 sm:pt-0"
      >
        <ProductTabs tabs={tabs} />
        <div className="mt-8">
          <LinkButton href="/shop" variant="secondary">
            View all products <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </Section>

      <div className="bg-surface-2">
        <Section eyebrow="Know what you buy" title="Genuine and Aftermarket Parts" intro="Each product is clearly classified so you always know exactly what you are getting.">
          <div className="grid gap-4 md:grid-cols-3">
            {types.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-surface p-6">
                <BadgeCheck className="mb-3 h-6 w-6 text-accent-text" />
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <p className="mt-2 text-sm text-muted">{t.text}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section eyebrow="Why Brothers" title="Why Choose Brothers Auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-hero text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="bg-surface-2">
        <Section eyebrow="Vehicles" title="Vehicle Brands We Serve">
          <ul className="flex flex-wrap gap-2">
            {vehicleBrands.map((b) => (
              <li key={b} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold">
                {b}
              </li>
            ))}
            <li className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted">and more</li>
          </ul>
        </Section>
      </div>

      {/* AI */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-8 overflow-hidden rounded-2xl bg-hero p-8 text-hero-fg sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-4 w-4" /> Brothers AI Parts Expert
            </p>
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Ask in Kiswahili or English</h2>
            <p className="mt-3 max-w-xl text-[#c0c7d1]">
              Describe the part and your vehicle, for example “Natafuta front shock absorber ya Toyota Harrier 2015”.
              The assistant searches our real inventory and flags anything that needs human confirmation.
            </p>
            <div className="mt-6">
              <LinkButton href="/ai-assistant" size="lg">Meet the Parts Expert</LinkButton>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-[#c0c7d1]">
            <p className="font-semibold text-white">Status</p>
            <p className="mt-1">Arrives in a later build phase. It will need an AI provider key to be switched on.</p>
          </div>
        </div>
      </section>

      <Section eyebrow="Reviews" title="Customer Reviews" className="pt-0 sm:pt-0">
        <div className="flex items-start gap-4 rounded-xl border border-dashed border-border bg-surface p-6">
          <Star className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" />
          <p className="text-sm text-muted">
            Reviews appear here once customers who have bought from us submit them. We never publish invented reviews or ratings.
          </p>
        </div>
      </Section>

      <div className="bg-surface-2">
        <Section eyebrow="For the trade" title="Garage and Wholesale Services" intro="Mechanics, garages, dealers and fleet operators can request bulk quotations and, once approved, trade pricing.">
          <LinkButton href="/quotation" size="lg">Request a Quotation <ArrowRight className="h-4 w-4" /></LinkButton>
        </Section>
      </div>

      <Section title="WhatsApp Support" eyebrow="Talk to us">
        <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8 md:grid-cols-[260px_1fr]">
          <Image
            src="/brand/flyer.webp"
            alt="Brothers Auto Spare Parts flyer: Bora sehemu za gari, with phone 0627 858827 and 0741 939 264"
            width={1024}
            height={1536}
            sizes="260px"
            className="mx-auto h-auto w-full max-w-[260px] rounded-lg"
          />
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <MessageCircle className="mt-1 h-8 w-8 shrink-0 text-accent-text" />
              <p className="max-w-xl text-muted">
                Tupigie au WhatsApp. Send us the part name, OEM number or a photo and our team will help you find the right part.
              </p>
            </div>
            <ul className="space-y-1 font-display text-xl font-extrabold">
              {site.phones.map((p) => (<li key={p}>{p}</li>))}
            </ul>
            <p className="text-sm text-muted">{site.instagram.handle} · {site.location}</p>
            <WhatsAppButton />
          </div>
        </div>
      </Section>

      <Section title="Newsletter" eyebrow="Stay informed" className="pt-0 sm:pt-0">
        <form className="flex max-w-xl flex-col gap-3 sm:flex-row" aria-describedby="nl-note">
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input
            id="nl-email"
            type="email"
            disabled
            placeholder="Your email address"
            className="h-12 flex-1 rounded-lg border border-border bg-surface px-4 text-sm disabled:opacity-60"
          />
          <button disabled className="h-12 rounded-lg bg-accent px-6 text-sm font-semibold text-accent-fg opacity-60">
            Subscribe
          </button>
        </form>
        <p id="nl-note" className="mt-2 text-xs text-muted">Newsletter sign-up opens once email delivery is configured.</p>
      </Section>
    </>
  );
}
