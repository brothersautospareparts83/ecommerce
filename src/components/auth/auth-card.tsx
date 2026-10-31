import { Suspense } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-card">
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
