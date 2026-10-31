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
    <section id={id} className={cn("mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20", className)}>
      <div className="mb-8 max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-text">{eyebrow}</p>
        )}
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {intro && <p className="mt-3 text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}
