import type { Metadata } from "next";
import { T } from "@/lib/i18n";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-8">
      <h1 className="text-3xl font-extrabold"><T en="Your cart" sw="Kikapu chako" /></h1>
      <CartView />
    </div>
  );
}
