import { cn } from "@/lib/utils";

export function Section({
  title, eyebrow, intro, children, className, id,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12", className)}>
      <div className="mb-5 max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-text">{eyebrow}</p>
        )}
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}
