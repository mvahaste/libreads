"use client";

import { useBrowseNavGroups } from "@/components/browse/browse-nav";
import { SectionPage } from "@/components/ui/section-page";
import { useTranslations } from "next-intl";

export function BrowseShell({ children }: { children: React.ReactNode }) {
  const groups = useBrowseNavGroups();
  const t = useTranslations("browse");

  return (
    <SectionPage title={t("title")} description={t("description")} groups={groups}>
      {children}
    </SectionPage>
  );
}
