import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Car, MapPin, MessageCircle, Phone, Search, Truck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { T } from "@/lib/i18n";
import { site, toIntl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "Brothers Auto Spare Parts is a spare parts shop in Kariakoo, Dar es Salaam, for cars and motorcycles.",
};

const steps = [
  { icon: Search, en: "Find your part", sw: "Tafuta kipuri chako", enText: "Search by name or part number, or browse the categories.", swText: "Tafuta kwa jina au namba ya kipuri, au tazama makundi." },
  { icon: MessageCircle, en: "Send your order on WhatsApp", sw: "Tuma oda yako kwa WhatsApp", enText: "We confirm the price, the delivery fee and how to pay.", swText: "Tunakuthibitishia bei, gharama ya usafirishaji na jinsi ya kulipa." },
  { icon: Car, en: "We confirm it fits", sw: "Tunathibitisha inafaa", enText: "Send your chassis number and our team checks the part fits your vehicle.", swText: "Tuma chassis number yako na timu yetu inakagua kipuri kinafaa gari lako." },
  { icon: Camera, en: "Approve a photo of your part", sw: "Idhinisha picha ya kipuri chako", enText: "Before we deliver, we send you a real photo of your exact part.", swText: "Kabla hatujakupelekea, tunakutumia picha halisi ya kipuri chako." },
  { icon: Truck, en: "Delivery or pickup", sw: "Kufikishiwa au kuchukua", enText: "We deliver, or you collect from the shop in Kariakoo.", swText: "Tunakufikishia, au unachukua dukani Kariakoo." },
];

const promises = [
  { en: "Honest advice", sw: "Ushauri wa kweli", enText: "We tell you if a part is genuine, OEM equivalent or aftermarket, and we never pass off one as another.", swText: "Tunakuambia kama kipuri ni halisi, OEM au aftermarket, na hatuchanganyi kimoja na kingine." },
  { en: "Fitment checked", sw: "Tunakagua inafaa", enText: "We do not guess. We confirm the part with your chassis number before you order.", swText: "Hatubahatishi. Tunathibitisha kipuri kwa chassis number yako kabla ya kuagiza." },
  { en: "Clear prices", sw: "Bei wazi", enText: "Prices are shown in TSh. If a part has no price yet, we say so and you can ask us.", swText: "Bei zinaonyeshwa kwa TSh. Kipuri kisipokuwa na bei bado, tunasema hivyo na unaweza kutuuliza." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-5 sm:pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text"><T en="About us" sw="Kuhusu sisi" /></p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">Brothers Auto Spare Parts</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted sm:text-base">
          <T en={`${site.motto}. A spare parts shop in Kariakoo, Dar es Salaam, for cars and motorcycles.`} sw={`${site.motto}. Duka la vipuri vya magari na pikipiki, Kariakoo, Dar es Salaam.`} />
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/shop" size="lg" className="rounded-full"><T en="Browse the parts" sw="Tazama vipuri" /> <ArrowRight className="h-4 w-4" /></LinkButton>
          <WhatsAppButton />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:space-y-14">
        <Reveal>
          <section className="grid items-center gap-8 md:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-extrabold sm:text-2xl"><T en="Who we are" sw="Sisi ni nani" /></h2>
              <p className="text-sm leading-relaxed text-muted sm:text-base">
                <T
                  en="Brothers Auto Spare Parts sells spare parts for cars and motorcycles from our shop in Kariakoo, Dar es Salaam. You can visit us, call us, or order through this website and finish your order with our team on WhatsApp."
                  sw="Brothers Auto Spare Parts tunauza vipuri vya magari na pikipiki kutoka dukani kwetu Kariakoo, Dar es Salaam. Unaweza kututembelea, kutupigia simu, au kuagiza kupitia tovuti hii na kukamilisha oda yako na timu yetu kwa WhatsApp."
                />
              </p>
              <p className="text-sm leading-relaxed text-muted sm:text-base">
                <T
                  en="More than 1,500 parts are listed on this website, from engine and brake parts to suspension, electrical, cooling and body parts. If you cannot find a part, send us its name, a photo or your chassis number and we will check for you."
                  sw="Zaidi ya vipuri 1,500 vimeorodheshwa kwenye tovuti hii, kuanzia vya injini na breki hadi suspension, umeme, upoozaji na mwili wa gari. Usipopata kipuri, tutumie jina lake, picha au chassis number yako na tutakuangalia."
                />
              </p>
            </div>
            <Image src="/brand/flyer.webp" alt="Brothers Auto Spare Parts flyer" width={1024} height={1536} sizes="260px" className="mx-auto h-auto w-full max-w-[220px] rounded-xl border border-border md:max-w-none" />
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl"><T en="How ordering works" sw="Jinsi kuagiza kunavyofanya kazi" /></h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map(({ icon: Icon, en, sw, enText, swText }, i) => (
                <li key={en} className="rounded-2xl border border-border bg-surface shadow-card p-4">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <p className="text-xs font-bold text-accent-text">{i + 1}</p>
                  <h3 className="font-display text-sm font-bold"><T en={en} sw={sw} /></h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted"><T en={enText} sw={swText} /></p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl"><T en="What you can count on" sw="Unachoweza kutegemea" /></h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {promises.map(({ en, sw, enText, swText }) => (
                <li key={en} className="rounded-2xl border border-border bg-surface shadow-card p-5">
                  <BadgeCheck className="mb-3 h-6 w-6 text-accent-text" aria-hidden="true" />
                  <h3 className="font-display font-bold"><T en={en} sw={sw} /></h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted"><T en={enText} sw={swText} /></p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
            <h2 className="font-display text-xl font-extrabold sm:text-2xl"><T en="Visit or contact us" sw="Tutembelee au tuwasiliane" /></h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden="true" /> <span>{site.location}</span></li>
                {site.phones.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-accent-text" aria-hidden="true" />
                    <a href={`tel:+${toIntl(p)}`} className="font-semibold hover:underline">{p}</a>
                  </li>
                ))}
                <li className="flex items-center gap-3 text-muted">
                  <Link href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-fg hover:underline">Instagram {site.instagram.handle}</Link>
                  <span aria-hidden="true">·</span>
                  <Link href={site.tiktok.url} target="_blank" rel="noopener noreferrer" className="hover:text-fg hover:underline">TikTok {site.tiktok.handle}</Link>
                </li>
              </ul>
              <div className="flex flex-col items-start justify-center gap-3">
                <p className="text-sm text-muted">
                  <T en="Send us the part name, its number or a photo. We reply on WhatsApp." sw="Tutumie jina la kipuri, namba yake au picha. Tunajibu kwa WhatsApp." />
                </p>
                <WhatsAppButton />
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
