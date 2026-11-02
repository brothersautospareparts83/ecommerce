import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/layout/coming-soon";

// Pages for features scheduled in later phases. Each is an honest placeholder, not a fake feature.
const pages: Record<string, { title: string; description: string }> = {
  "ai-assistant": { title: "AI Parts Expert", description: "A Kiswahili and English assistant that searches our real inventory. Needs an AI provider key." },
  quotation: { title: "Request a Quotation", description: "Request prices for multiple parts and receive a reviewed quotation." },
  faq: { title: "Frequently Asked Questions", description: "Answers about ordering, delivery and parts, to be written with the owner." },
  cart: { title: "Shopping Cart", description: "Your cart and secure checkout are coming soon." },
  privacy: { title: "Privacy Policy", description: "Legal text must be provided or approved by the business owner before publishing." },
  terms: { title: "Terms and Conditions", description: "Legal text must be provided or approved by the business owner before publishing." },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: pages[slug]?.title ?? "Not found" };
}

export default async function InfoPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <ComingSoon title={page.title} description={page.description} />;
}
