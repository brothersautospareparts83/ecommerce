"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** The order is saved: empty the cart. */
export function ClearCartOnce() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
