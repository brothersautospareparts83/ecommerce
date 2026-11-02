import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Emblem plus wordmark: dark ink on the light theme, white on the dark theme. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Brothers Auto Spare Parts home" className={cn("flex items-center gap-3 text-chrome-fg", className)}>
      <Image src="/brand/logo-emblem-ink.webp" alt="" width={480} height={327} priority className="h-10 w-auto dark:hidden" />
      <Image src="/brand/logo-emblem-v2.webp" alt="" width={480} height={327} priority className="hidden h-10 w-auto dark:block" />
      <span className="font-display leading-none">
        <span className="block text-lg font-bold italic tracking-wide">BROTHERS</span>
        <span className="block text-[10px] font-semibold tracking-[0.2em] text-accent">AUTO SPARE PARTS</span>
      </span>
    </Link>
  );
}
