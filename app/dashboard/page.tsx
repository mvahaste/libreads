import DashboardPage from "@/components/dashboard/dashboard-page";
import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  const [summary, tDashboard] = await Promise.all([caller.books.dashboardSummary(), getTranslations("dashboard")]);

  return (
    <DashboardPage
      summary={summary}
      labels={{
        title: tDashboard("title"),
        description: tDashboard("description"),
        currentlyReading: {
          title: tDashboard("sections.currentlyReading.title"),
          description: tDashboard("sections.currentlyReading.description"),
          empty: tDashboard("sections.currentlyReading.empty"),
        },
        upNext: {
          title: tDashboard("sections.upNext.title"),
          description: tDashboard("sections.upNext.description"),
          empty: tDashboard("sections.upNext.empty"),
          addedOn: tDashboard("sections.upNext.addedOn"),
        },
        awaitingRating: {
          title: tDashboard("sections.awaitingRating.title"),
          description: tDashboard("sections.awaitingRating.description"),
          empty: tDashboard("sections.awaitingRating.empty"),
          finishedOn: tDashboard("sections.awaitingRating.finishedOn"),
        },
        recentlyFinished: {
          title: tDashboard("sections.recentlyFinished.title"),
          description: tDashboard("sections.recentlyFinished.description"),
          empty: tDashboard("sections.recentlyFinished.empty"),
          finishedOn: tDashboard("sections.recentlyFinished.finishedOn"),
        },
        recentActivity: {
          title: tDashboard("sections.recentActivity.title"),
          description: tDashboard("sections.recentActivity.description"),
          empty: tDashboard("sections.recentActivity.empty"),
          started: tDashboard("sections.recentActivity.started"),
          finished: tDashboard("sections.recentActivity.finished"),
          addedToWantToRead: tDashboard("sections.recentActivity.addedToWantToRead"),
        },
        topTags: {
          title: tDashboard("sections.topTags.title"),
          description: tDashboard("sections.topTags.description"),
          empty: tDashboard("sections.topTags.empty"),
        },
        actions: {
          openBook: tDashboard("actions.openBook"),
        },
      }}
    />
  );
}
