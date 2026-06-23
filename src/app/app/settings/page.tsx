import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, mobile: true, role: true },
  });

  const user = {
    name: dbUser?.name ?? session.user.name ?? "User",
    email: dbUser?.email ?? session.user.email ?? "—",
    image: dbUser?.image ?? session.user.image ?? null,
    mobile: dbUser?.mobile ?? null,
    role: dbUser?.role ?? session.user.role ?? "Member",
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, security and appearance." />
      <SettingsClient user={user} />
    </>
  );
}
