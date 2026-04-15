import { SettingsShell } from "@/components/settings/settings-shell";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  return <SettingsShell isAdmin={!!session.user.isAdmin}>{children}</SettingsShell>;
}
