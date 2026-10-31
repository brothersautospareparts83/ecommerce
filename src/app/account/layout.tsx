import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/auth-forms";

async function AccountShell({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Account" className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {[
          { href: "/account", label: "Overview" },
          { href: "/account/orders", label: "Orders" },
          { href: "/account/profile", label: "Profile" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">
            {l.label}
          </Link>
        ))}
        <span className="px-3 py-2 text-sm text-muted" title="Arrives in a later phase">Quotations · Wishlist · Saved vehicles (soon)</span>
        <SignOutButton className="ml-auto" />
      </nav>
      {children}
    </div>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading your account…</div>}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}
