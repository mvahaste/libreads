"use client";

import {
  LucideBookMarked,
  LucideBookPlus,
  LucideBuilding2,
  LucideLibraryBig,
  LucideListOrdered,
  LucideTags,
  LucideUser,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { type NavGroup } from "../ui/section-nav";

export type BrowseSection =
  | "my-books"
  | "tags"
  | "books"
  | "authors"
  | "series"
  | "genres"
  | "publishers"
  | "add-books";

interface NavGroupConfig {
  labelKey: "groups.my-library" | "groups.catalog" | "groups.add-books";
  items: { id: BrowseSection; icon: React.ReactNode; href: string }[];
}

const navGroupConfigs: NavGroupConfig[] = [
  {
    labelKey: "groups.my-library",
    items: [
      { id: "my-books", icon: <LucideBookMarked />, href: "/browse/my-books" },
      { id: "tags", icon: <LucideTags />, href: "/browse/tags" },
    ],
  },
  {
    labelKey: "groups.catalog",
    items: [
      { id: "books", icon: <LucideLibraryBig />, href: "/browse/books" },
      { id: "authors", icon: <LucideUser />, href: "/browse/authors" },
      { id: "series", icon: <LucideListOrdered />, href: "/browse/series" },
      { id: "genres", icon: <LucideTags />, href: "/browse/genres" },
      { id: "publishers", icon: <LucideBuilding2 />, href: "/browse/publishers" },
    ],
  },
  {
    labelKey: "groups.add-books",
    items: [{ id: "add-books", icon: <LucideBookPlus />, href: "/browse/add-books" }],
  },
];

export function useBrowseNavGroups(): NavGroup<BrowseSection>[] {
  const t = useTranslations("browse");
  const tEntities = useTranslations("common.entities");

  return useMemo(() => {
    const itemLabelMap: Record<BrowseSection, string> = {
      "my-books": t("my-books.title"),
      tags: tEntities("tags"),
      books: tEntities("books"),
      authors: tEntities("authors"),
      series: tEntities("series"),
      genres: tEntities("genres"),
      publishers: tEntities("publishers"),
      "add-books": t("add-books.title"),
    };

    return navGroupConfigs.map((group) => ({
      label: t(group.labelKey),
      items: group.items.map((item) => ({
        id: item.id,
        icon: item.icon,
        label: itemLabelMap[item.id],
        href: item.href,
      })),
    }));
  }, [t, tEntities]);
}
