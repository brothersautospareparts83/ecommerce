import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My Profile" };

async function Profile() {
  const p = await requireUser();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-extrabold">My profile</h1>
      <ProfileForm fullName={p.full_name ?? ""} phone={p.phone ?? ""} language={p.preferred_language} email={p.email ?? ""} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
