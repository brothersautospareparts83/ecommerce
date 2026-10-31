import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" subtitle="Access your orders, quotations and saved vehicles.">
      <LoginForm />
    </AuthCard>
  );
}
