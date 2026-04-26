import StatisticsPage from "@/components/statistics/statistics-page";
import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  const overallStats = await caller.books.overallUserStats();

  return <StatisticsPage overallStats={overallStats} />;
}
