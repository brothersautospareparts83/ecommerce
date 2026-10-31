import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Order faster, track deliveries and request quotations.">
      <RegisterForm />
    </AuthCard>
  );
}
