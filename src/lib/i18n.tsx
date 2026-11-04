"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Simple English / Swahili switch. Page text is written inline as a pair: t("English", "Kiswahili").
 * Product names, descriptions and part numbers always stay in English, to keep the catalogue professional.
 */
export type Lang = "en" | "sw";

/** Swahili for the shop's fixed interface words. Anything not listed stays as written (product names always stay in English). */
export const SW: Record<string, string> = {
  Ask: "Uliza", "Ask on WhatsApp": "Uliza kwa WhatsApp",
  "Search parts…": "Tafuta spare…", "Order received": "Oda imepokelewa", "Track order": "Fuatilia oda", Product: "Bidhaa",
  Home: "Mwanzo", Shop: "Duka", Cart: "Kikapu", Account: "Akaunti", More: "Zaidi", Categories: "Makundi",
  "All Products": "Bidhaa Zote", "All Categories": "Makundi Yote", "Vehicle Catalog": "Katalogi ya Magari", "AI Assistant": "Msaidizi",
  "About Us": "Kuhusu Sisi", Contact: "Mawasiliano", "Request a Quotation": "Omba Bei", FAQ: "Maswali", "Privacy Policy": "Sera ya Faragha",
  "Terms & Conditions": "Masharti", "Parts Finder": "Kutafuta Spare", "Parts Guide": "Mwongozo wa Spare", "Request Quote": "Omba Bei",
  "Quick Links": "Viungo Vya Haraka", "Customer Care": "Huduma kwa Wateja", "Our Services": "Huduma Zetu", "Track Order": "Fuatilia Oda",
  Support: "Msaada", "Spare Parts": "Spare", "Garage Services": "Huduma za Gereji", "Bulk Orders": "Oda za Jumla",
  "Stay Connected": "Endelea Kuwasiliana", "Chassis No.": "Namba ya Chassis", "Part Number": "Namba ya Kipuri", "Part Name": "Jina la Kipuri", Vehicle: "Gari",
  Search: "Tafuta", "Find Your Exact Spare Part": "Tafuta Kipuri Chako Hasa", "Browse all parts": "Tazama spare zote",
  "Search by name (English or Kiswahili), part number or SKU.": "Tafuta kwa jina (Kiingereza au Kiswahili), namba ya kipuri au SKU.",
  "Enter chassis number, VIN or frame number": "Weka namba ya chassis, VIN au frame", "Enter an OEM or part number": "Weka namba ya OEM au ya kipuri",
  "e.g. brake pads, chujio la oil, front shock": "mf. brake pads, chujio la oil, front shock", "Make, model and year, e.g. Toyota Harrier 2015": "Chapa, modeli na mwaka, mf. Toyota Harrier 2015",
  "Search parts, part numbers, brands…": "Tafuta spare, namba za spare, chapa…",
  "Order now": "Agiza sasa", "Add to Cart": "Weka Kikapuni", "Add to cart": "Weka kikapuni", "Added to cart": "Imewekwa kikapuni", "Your cart": "Kikapu chako", "Your cart is empty.": "Kikapu chako ni tupu.", "Browse parts": "Tazama spare",
  Subtotal: "Jumla ndogo", Checkout: "Lipa / Kamilisha", "Order summary": "Muhtasari wa oda", "Full name": "Jina kamili",
  "Phone (WhatsApp if possible)": "Simu (WhatsApp ikiwezekana)", "Email (optional)": "Barua pepe (si lazima)", "How do you want to get it?": "Unataka kuipataje?",
  "Collect from the shop (Kariakoo)": "Nachukua dukani (Kariakoo)", "Delivery (fee confirmed with you)": "Kufikishiwa (gharama tunakuthibitishia)",
  "Vehicle or notes (optional)": "Gari au maelezo (si lazima)", "Region / city": "Mkoa / mji", "Delivery address": "Anwani ya kufikishiwa",
  "Place order, then send on WhatsApp": "Weka oda, kisha tuma kwa WhatsApp", "Saving your order…": "Inahifadhi oda yako…",
  "Delivery is charged separately and confirmed with you. Prices are checked again when you place the order.": "Gharama ya usafirishaji ni tofauti na tunakuthibitishia. Bei zinakaguliwa tena unapoweka oda.",
  "Shop all products": "Bidhaa zote", Filters: "Vichujio", Apply: "Tumia", "Clear filters": "Futa vichujio", "Sort by": "Panga kwa", Category: "Kundi",
  "Search by name, part number or SKU": "Tafuta kwa jina, namba ya kipuri au SKU", Mixed: "Mchanganyiko", Newest: "Mpya zaidi",
  "Price: low to high": "Bei: ndogo hadi kubwa", "Price: high to low": "Bei: kubwa hadi ndogo", "Name A–Z": "Jina A–Z", "Best match": "Inayolingana zaidi",
  "Car parts guide": "Mwongozo wa spare za gari", "Track your order": "Fuatilia oda yako", "Order number": "Namba ya oda", "Tracking code": "Namba ya kufuatilia", Track: "Fuatilia",
  "Open menu": "Fungua menyu", "Close menu": "Funga menyu", Menu: "Menyu",
};

export function tlWith(lang: Lang, k: string): string {
  return lang === "sw" ? SW[k] ?? k : k;
}
const KEY = "brothers-auto-lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (en: string, sw: string) => string; tl: (k: string) => string };
const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (en) => en, tl: (k) => k });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    // Read after hydration so the server and the first client render match.
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* private mode */
    }
    const initial: Lang = saved === "sw" || saved === "en" ? saved : navigator.language?.toLowerCase().startsWith("sw") ? "sw" : "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "sw" ? "sw" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* private mode */
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (en, sw) => (lang === "sw" ? sw : en), tl: (k) => tlWith(lang, k) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** A fixed interface word or sentence looked up in the dictionary: <TL k="Shop" /> */
export function TL({ k }: { k: string }) {
  const { tl } = useLang();
  return <>{tl(k)}</>;
}

/** Text for server components: <T en="Shop" sw="Duka" /> */
export function T({ en, sw }: { en: string; sw: string }) {
  const { t } = useLang();
  return <>{t(en, sw)}</>;
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className={className}>
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2 py-1 text-xs font-bold uppercase transition-colors ${lang === l ? "rounded bg-accent text-accent-fg" : "text-chrome-muted hover:text-chrome-fg"}`}
        >
          {l === "en" ? "EN" : "SW"}
        </button>
      ))}
    </div>
  );
}
