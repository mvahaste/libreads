"use client";

import { EntityBrowseSection } from "@/components/browse/entity-browse-section";
import { authClient } from "@/lib/auth/auth-client";
import { entityNameSortOptions } from "@/lib/browse-params";
import { useTranslations } from "next-intl";

type GenreBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function GenresPage() {
  const { data: session } = authClient.useSession();
  const tActions = useTranslations("common.actions");
  const tEntities = useTranslations("common.entities");
  const tEntityActions = useTranslations("browse.entity-actions");

  const actions = session?.user.isAdmin
    ? {
        manageLabel: tEntityActions("manage", { entity: tEntities("genres") }),
        edit: { label: `${tActions("edit")} (${tEntityActions("coming-soon")})`, disabled: true },
        delete: { label: `${tActions("delete")} (${tEntityActions("coming-soon")})`, disabled: true },
      }
    : undefined;

  return (
    <EntityBrowseSection<GenreBrowseItem>
      sectionKey="genres"
      sortOptions={entityNameSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allGenres.queryOptions(params)}
      mapItem={(item) => ({
        id: item.id,
        name: item.name,
        href: `/browse/books?genre=${item.slug}`,
        actions,
      })}
    />
  );
}
