import { MessageCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/site";

export function WhatsAppButton({
  label = "Chat on WhatsApp",
  message = "Hello Brothers Auto Spare Parts, I need help finding a part.",
  variant = "whatsapp",
  size = "lg",
}: {
  label?: string;
  message?: string;
  variant?: "whatsapp" | "outline" | "secondary";
  size?: "md" | "lg";
}) {
  return (
    <LinkButton href={whatsappUrl(message)} variant={variant} size={size} target="_blank" rel="noopener noreferrer">
      <MessageCircle className="h-5 w-5" /> {label}
    </LinkButton>
  );
}
