import { site, whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const icon = "h-[18px] w-[18px]";

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={icon} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M16.6 3c.3 2.3 1.7 3.9 4 4.1v3.1c-1.5 0-2.9-.4-4-1.1v6.1c0 3.2-2.4 5.8-5.7 5.8A5.7 5.7 0 0 1 5.2 15c0-3.2 2.6-5.8 5.9-5.7v3.2c-1.5-.2-2.7.9-2.7 2.5 0 1.4 1 2.5 2.5 2.5 1.5 0 2.5-1 2.5-2.7V3h3.2z" />
    </svg>
  );
}

function WhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.3.7-1.1.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.2 1.8.8 2.5.8 3.4.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

const link = "flex h-9 w-9 items-center justify-center rounded-full border border-current/30 transition-colors hover:border-accent hover:text-accent";

/** Round icon links to our social media and WhatsApp, with no handle text. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center gap-2", className)}>
      <li><a href={site.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={link}><Instagram /></a></li>
      <li><a href={site.tiktok.url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={link}><TikTok /></a></li>
      <li><a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={link}><WhatsApp /></a></li>
    </ul>
  );
}
