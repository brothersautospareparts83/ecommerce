"use client";

import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/site";

/** Green WhatsApp button that floats above the assistant button. Hidden where it would cover prices or totals. */
export function WhatsAppFloat() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;
  return (
    <a
      href={whatsappUrl("Hello Brothers Auto Spare Parts, I need help finding a part.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-[8.25rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-24"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.19 1.6 6.01L4 29l8.15-1.57a12 12 0 0 0 3.89.65c6.64 0 12.04-5.4 12.04-12.04C28.08 8.4 22.68 3 16.04 3Zm0 21.9c-1.2 0-2.37-.32-3.4-.93l-.24-.14-4.84.93.94-4.72-.16-.25a9.86 9.86 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9s9.9 4.44 9.9 9.9-4.44 10.36-9.9 10.36Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
