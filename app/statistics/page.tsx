import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  const overallStats = await caller.books.overallUserStats();

  return (
    <pre className="bg-card text-muted-foreground rounded border p-4 font-mono text-sm">
      {JSON.stringify(overallStats, null, "  ")}
    </pre>
  );
}
