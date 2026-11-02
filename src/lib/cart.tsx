"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** What the cart remembers about a product. Prices here are for display only: checkout re-reads them on the server. */
export type CartLine = { productId: string; slug: string; sku: string; name: string; priceTzs: number; imageUrl: string | null; quantity: number };

const KEY = "brothers-auto-cart";
const MAX_QTY = 99;

type CartContext = {
  lines: CartLine[];
  count: number;
  subtotalTzs: number;
  ready: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((l) => l && typeof l.productId === "string" && Number.isInteger(l.quantity) && l.quantity > 0).slice(0, 100);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The cart lives in localStorage, which only exists in the browser: read it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: cart lasts for this visit only */ }
  }, []);

  const value = useMemo<CartContext>(() => ({
    lines,
    ready,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalTzs: lines.reduce((n, l) => n + l.priceTzs * l.quantity, 0),
    add: (line, quantity = 1) => {
      const existing = lines.find((l) => l.productId === line.productId);
      commit(existing
        ? lines.map((l) => (l.productId === line.productId ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
        : [...lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }]);
    },
    setQuantity: (productId, quantity) =>
      commit(quantity < 1 ? lines.filter((l) => l.productId !== productId) : lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l))),
    remove: (productId) => commit(lines.filter((l) => l.productId !== productId)),
    clear: () => commit([]),
  }), [lines, ready, commit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
