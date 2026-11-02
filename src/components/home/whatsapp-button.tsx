import { MessageCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/site";
import { T } from "@/lib/i18n";

export function WhatsAppButton({
  label,
  message = "Hello Brothers Auto Spare Parts, I need help finding a part.",
  variant = "whatsapp",
  size = "lg",
}: {
  label?: string;
  message?: string;
  variant?: "whatsapp" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <LinkButton href={whatsappUrl(message)} variant={variant} size={size} className="rounded-full px-4 text-sm" target="_blank" rel="noopener noreferrer">
      <MessageCircle className="h-4 w-4" /> {label ?? <T en="Chat on WhatsApp" sw="Ongea nasi WhatsApp" />}
    </LinkButton>
  );
}
