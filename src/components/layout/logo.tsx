import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Official emblem plus wordmark, designed for the always-dark header/footer. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Brothers Auto Spare Parts home" className={cn("flex items-center gap-3 text-chrome-fg", className)}>
      <Image
        src="/brand/logo-emblem-v2.webp"
        alt=""
        width={480}
        height={327}
        priority
        className="h-10 w-auto"
      />
      <span className="font-display leading-none">
        <span className="block text-lg font-extrabold italic tracking-wide">BROTHERS</span>
        <span className="block text-[10px] font-bold tracking-[0.2em] text-accent">AUTO SPARE PARTS</span>
      </span>
    </Link>
  );
}
