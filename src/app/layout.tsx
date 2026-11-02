import { Suspense } from "react";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartProvider } from "@/lib/cart";
import { ChatWidget } from "@/components/assistant/chat-widget";
import { LanguageProvider } from "@/lib/i18n";
import { site } from "@/lib/site";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["italic"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Quality Parts. Trusted Performance.`, template: `%s | ${site.name}` },
  description:
    "Find the right automotive spare parts with confidence. Quality products, smart vehicle matching and reliable service from Brothers Auto Spare Parts, Kariakoo, Dar es Salaam.",
  openGraph: { siteName: site.name, type: "website", locale: "en_TZ" },
};

// Runs before first paint: the saved colour theme (orange by default). Prevents a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem('ba-theme');document.documentElement.dataset.theme=t==='gold'?'gold':'orange'}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} data-theme="orange" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen pb-16 antialiased lg:pb-0">
        <LanguageProvider>
          <CartProvider>
            <Suspense fallback={<div className="h-[116px] bg-chrome lg:h-[64px]" />}>
              <Header />
            </Suspense>
            <main id="main">{children}</main>
            <Footer />
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
            <Suspense fallback={null}>
              <ChatWidget />
            </Suspense>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
