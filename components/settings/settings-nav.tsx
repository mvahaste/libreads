"use client";

import { LucideAlertTriangle, LucideServer, LucideShield, LucideUserCog, LucideUsers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { type NavItem } from "../ui/section-nav";

export type SettingsSection = "preferences" | "security" | "danger" | "system" | "users";

const navItemConfigs: { id: SettingsSection; icon: React.ReactNode; variant?: "destructive"; adminOnly?: boolean }[] = [
  { id: "preferences", icon: <LucideUserCog /> },
  { id: "security", icon: <LucideShield /> },
  { id: "danger", icon: <LucideAlertTriangle />, variant: "destructive" },
  { id: "users", icon: <LucideUsers />, adminOnly: true },
  { id: "system", icon: <LucideServer />, adminOnly: true },
];

export function useSettingsNavItems(isAdmin: boolean): NavItem<SettingsSection>[] {
  const t = useTranslations("settings");
  const tEntities = useTranslations("common.entities");

  return useMemo(() => {
    const sectionTitleMap: Record<SettingsSection, string> = {
      preferences: t("preferences.title"),
      security: t("security.title"),
      danger: t("danger.title"),
      users: tEntities("users"),
      system: tEntities("system"),
    };

    return navItemConfigs
      .filter((item) => !item.adminOnly || isAdmin)
      .map((item) => ({
        id: item.id,
        icon: item.icon,
        label: sectionTitleMap[item.id],
        variant: item.variant,
        badge: item.adminOnly ? (
          <span className="text-muted-foreground ml-auto text-[0.625rem] font-semibold tracking-wider uppercase">
            Admin
          </span>
        ) : undefined,
      }));
  }, [isAdmin, t, tEntities]);
}
