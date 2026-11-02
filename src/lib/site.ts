// Contact details below come from the owner's official flyer. Environment variables override them.
const fromEnv = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** Local Tanzanian number "0627 858827" -> international digits "255627858827". */
export const toIntl = (local: string) => `255${local.replace(/\D/g, "").replace(/^0/, "")}`;

const phones = ["0627 858827", "0741 939 264"];

export const site = {
  name: "Brothers Auto Spare Parts",
  shortName: "Brothers Auto",
  tagline: "Quality parts. Trusted performance.",
  motto: "Quality Parts Keep You Moving",
  location: "Kariakoo, Dar es Salaam, Tanzania",
  // On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the live address, so links we send customers never say localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  phones,
  // WhatsApp defaults to the first phone number; confirm with the owner.
  whatsappNumber:
    fromEnv(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, "") ?? toIntl(phones[0]),
  email: fromEnv(process.env.NEXT_PUBLIC_BUSINESS_EMAIL),
  instagram: { handle: "@brothersautospareparts83", url: "https://www.instagram.com/brothersautospareparts83" },
  tiktok: { handle: "@brothersautospareparts83", url: "https://www.tiktok.com/@brothersautospareparts83" },
};

/** Returns a wa.me link. */
export function whatsappUrl(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.whatsappNumber}${text}`;
}

/** Links shown in the phone menu drawer. The desktop menu lives in components/layout/nav-bar.tsx. */
export const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/finder", label: "Parts Finder" },
  { href: "/parts-guide", label: "Parts Guide" },
  { href: "/ai-assistant", label: "AI Parts Expert" },
  { href: "/quotation", label: "Request Quote" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];