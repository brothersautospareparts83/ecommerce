import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Admin Sign In" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin sign in" subtitle="For Brothers Auto staff. Customer accounts cannot access the admin area.">
      <LoginForm defaultRedirect="/admin" />
    </AuthCard>
  );
}
