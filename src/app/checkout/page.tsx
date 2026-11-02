import type { Metadata } from "next";
import { T } from "@/lib/i18n";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-6 pt-5 sm:pt-8">
      <h1 className="text-3xl font-extrabold"><T en="Checkout" sw="Malipo na oda" /></h1>
      <CheckoutForm />
    </div>
  );
}
