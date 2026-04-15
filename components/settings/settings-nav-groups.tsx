"use client";

import { LucideAlertTriangle, LucideServer, LucideShield, LucideUserCog, LucideUsers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { type NavGroup } from "../ui/section-nav";

export type SettingsSection = "preferences" | "security" | "danger" | "system" | "users";

interface NavItemConfig {
  id: SettingsSection;
  icon: React.ReactNode;
  href: string;
  variant?: "destructive";
  adminOnly?: boolean;
}

interface NavGroupConfig {
  labelKey: "groups.account" | "groups.admin";
  items: NavItemConfig[];
}

const navGroupConfigs: NavGroupConfig[] = [
  {
    labelKey: "groups.account",
    items: [
      { id: "preferences", icon: <LucideUserCog />, href: "/settings/preferences" },
      { id: "security", icon: <LucideShield />, href: "/settings/security" },
      { id: "danger", icon: <LucideAlertTriangle />, href: "/settings/danger", variant: "destructive" },
    ],
  },
  {
    labelKey: "groups.admin",
    items: [
      { id: "users", icon: <LucideUsers />, href: "/settings/users", adminOnly: true },
      { id: "system", icon: <LucideServer />, href: "/settings/system", adminOnly: true },
    ],
  },
];

export function useSettingsNavGroups(isAdmin: boolean): NavGroup<SettingsSection>[] {
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

    return navGroupConfigs
      .map((group) => ({
        label: t(group.labelKey),
        items: group.items
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => ({
            id: item.id,
            icon: item.icon,
            label: sectionTitleMap[item.id],
            href: item.href,
            variant: item.variant as "destructive" | undefined,
            badge: item.adminOnly ? (
              <span className="text-muted-foreground ml-auto text-[0.625rem] font-semibold tracking-wider uppercase">
                Admin
              </span>
            ) : undefined,
          })),
      }))
      .filter((group) => group.items.length > 0);
  }, [isAdmin, t, tEntities]);
}
