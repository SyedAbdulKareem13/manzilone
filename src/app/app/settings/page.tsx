import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "—",
    role: session.user.role ?? "Member",
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and appearance." />
      <SettingsClient user={user} />
    </>
  );
}
