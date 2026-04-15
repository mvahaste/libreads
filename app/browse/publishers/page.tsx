"use client";

import { EntityBrowseSection } from "@/components/browse/entity-browse-section";
import { authClient } from "@/lib/auth/auth-client";
import { publisherSortOptions } from "@/lib/browse-params";
import { useTranslations } from "next-intl";

type PublisherBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function PublishersPage() {
  const { data: session } = authClient.useSession();
  const tActions = useTranslations("common.actions");
  const tEntities = useTranslations("common.entities");
  const tEntityActions = useTranslations("browse.entity-actions");

  const actions = session?.user.isAdmin
    ? {
        manageLabel: tEntityActions("manage", { entity: tEntities("publishers") }),
        edit: { label: `${tActions("edit")} (${tEntityActions("coming-soon")})`, disabled: true },
        delete: { label: `${tActions("delete")} (${tEntityActions("coming-soon")})`, disabled: true },
      }
    : undefined;

  return (
    <EntityBrowseSection<PublisherBrowseItem>
      sectionKey="publishers"
      sortOptions={publisherSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allPublishers.queryOptions(params)}
      mapItem={(item) => ({
        id: item.id,
        name: item.name,
        href: `/browse/books?publisher=${item.slug}`,
        actions,
      })}
    />
  );
}
