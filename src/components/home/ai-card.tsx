"use client";

import { MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Card that opens the floating parts assistant. */
export function AiExpertCard() {
  return (
    <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-accent/60 bg-hero p-5 text-hero-fg sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/20 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-16 h-16 w-[70%] -skew-y-[12deg] bg-gradient-to-l from-accent/60 via-accent/20 to-transparent" />
      <div className="relative flex items-start gap-4">
        <Settings className="h-12 w-12 shrink-0 text-accent" strokeWidth={1.6} aria-hidden="true" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-accent">Brothers Parts Assistant</p>
          <p className="mt-1 text-sm leading-relaxed text-[#c4c4c8]">Ask for a part, its price or a part number, in Kiswahili or English.</p>
        </div>
      </div>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="md"
          className="gap-2 border-white/40"
          onClick={() => window.dispatchEvent(new Event("open-assistant"))}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Start Chat →
        </Button>
      </div>
    </div>
  );
}
