import { Bot } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

/** Teaser for the AI Parts Expert. The assistant itself is built in a later phase. */
export function AiExpertCard() {
  return (
    <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-hero p-5 text-hero-fg sm:p-6">
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-fg">
          <Bot className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-accent">Brothers AI Parts Expert</p>
          <p className="mt-1 text-sm leading-relaxed text-[#c4c4c8]">
            Ask anything about spare parts, in Kiswahili or English.
          </p>
        </div>
      </div>
      <div className="relative flex items-center justify-between gap-3">
        <LinkButton href="/ai-assistant" variant="outline" size="md">Start Chat →</LinkButton>
        <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c4c4c8]">Coming soon</span>
      </div>
    </div>
  );
}
