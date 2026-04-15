import { PreferencesSection } from "@/components/settings/preferences/preferences-section";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  return <PreferencesSection name={session.user.name} email={session.user.email} />;
}
