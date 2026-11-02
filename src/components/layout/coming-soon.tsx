import { Construction } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-center">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent-text">
        <Construction className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-muted">{description}</p>
      <p className="mt-2 text-sm text-muted">This feature is not built yet.</p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/shop">Browse products</LinkButton>
        <LinkButton href="/" variant="secondary">Home</LinkButton>
      </div>
    </div>
  );
}
