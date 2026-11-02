import { Suspense } from "react";
import Link from "next/link";
import { requireStaff, isAdminRole } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/auth-forms";
import { roleLabel } from "@/lib/format";

// Built so far are links; the rest are placeholders labelled with the phase that delivers them.
const built = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/catalog", label: "Categories & brands" },
  { href: "/admin/users", label: "Users & roles", adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit logs", adminOnly: true },
];
const planned = [
  ["Bulk import screen", 5], ["Image verification", 6], ["Vehicle catalog", 7],
  ["OEM cross-reference", 7], ["Compatibility", 7], ["Customers", 11],
  ["Quotations", 11], ["AI analytics", 12], ["Reports", 12], ["Settings", 14], ["Integrations", 14],
] as const;

async function AdminShell({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-6 pt-5 sm:px-6 sm:pt-8 lg:grid-cols-[230px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <p className="truncate text-sm font-semibold">{me.full_name ?? me.email}</p>
          <p className="text-xs text-muted">{roleLabel[me.role]}</p>
          <SignOutButton className="mt-3 w-full" />
        </div>
        <nav aria-label="Admin" className="space-y-1">
          {built.filter((l) => !l.adminOnly || isAdminRole(me.role)).map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-2">{l.label}</Link>
          ))}
          <p className="px-3 pt-4 text-xs font-bold uppercase tracking-widest text-muted">Coming in later phases</p>
          {planned.map(([label, phase]) => (
            <p key={label} className="flex justify-between px-3 py-1.5 text-sm text-muted">
              <span>{label}</span><span className="text-xs">P{phase}</span>
            </p>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-muted">Loading admin…</div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
