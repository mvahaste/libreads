import { SystemSection } from "@/components/settings/system/system-section";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user.isAdmin) redirect("/settings/preferences");

  const [tSystem, tEntities] = await Promise.all([
    getTranslations("settings.system"),
    getTranslations("common.entities"),
  ]);

  const [users, books, authors, genres, publishers, series] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.author.count(),
    prisma.genre.count(),
    prisma.publisher.count(),
    prisma.series.count(),
  ]);

  return (
    <SystemSection
      title={tSystem("overview")}
      description={tSystem("overviewDescription")}
      labels={{
        users: tEntities("users"),
        books: tEntities("books"),
        authors: tEntities("authors"),
        genres: tEntities("genres"),
        publishers: tEntities("publishers"),
        series: tEntities("series"),
      }}
      stats={{ users, books, authors, genres, publishers, series }}
    />
  );
}
