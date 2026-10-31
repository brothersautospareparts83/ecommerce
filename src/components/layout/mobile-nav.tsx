"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navLinks } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // The bottom bar's "More" button asks this drawer to open.
  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener("open-menu", openMenu);
    return () => window.removeEventListener("open-menu", openMenu);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border text-chrome-fg transition-colors hover:border-accent hover:text-accent cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-bold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={close} className="rounded-lg px-3 py-3 font-medium hover:bg-surface-2">
                  {l.label}
                </Link>
              ))}
              <Link href="/account" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-3 font-medium hover:bg-surface-2">
                <User className="h-5 w-5" /> Account
              </Link>
            </nav>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
