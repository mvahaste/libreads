"use client";

import { useSettingsNavGroups } from "@/components/settings/settings-nav-groups";
import { SectionPage } from "@/components/ui/section-page";
import { useTranslations } from "next-intl";

interface SettingsShellProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

export function SettingsShell({ isAdmin, children }: SettingsShellProps) {
  const groups = useSettingsNavGroups(isAdmin);
  const t = useTranslations("settings");

  return (
    <SectionPage title={t("title")} description={t("description")} groups={groups}>
      {children}
    </SectionPage>
  );
}
