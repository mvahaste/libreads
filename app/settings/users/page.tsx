import { UsersSection } from "@/components/settings/users/users-section";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user.isAdmin) redirect("/settings/preferences");

  return <UsersSection />;
}
