import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-8">
      <h1 className="text-3xl font-extrabold">Your cart</h1>
      <CartView />
    </div>
  );
}
