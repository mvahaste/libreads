"use client";

import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

import LocaleSwitcher from "../locale-switcher";
import { SettingsGroup } from "../settings-group";
import ThemeSwitcher from "../theme-switcher";
import AvatarUpload from "./avatar-upload";
import NameEmailEdit from "./name-email-edit";

interface PreferencesSectionProps {
  name: string;
  email: string;
}

export function PreferencesSection({ name, email }: PreferencesSectionProps) {
  const t = useTranslations("settings.preferences");

  return (
    <div className="flex flex-col gap-8">
      {/* Profile */}
      <SettingsGroup title={t("profile")} description={t("profileDescription")}>
        <div className="flex flex-col gap-6">
          {/* Avatar */}
          <AvatarUpload name={name} label={t("profilePhoto")} description={t("profilePhotoDescription")} />
          {/* Email & name */}
          <NameEmailEdit defaultName={name} defaultEmail={email} />
        </div>
      </SettingsGroup>

      {/* Appearance */}
      <SettingsGroup title={t("appearance")} description={t("appearanceDescription")}>
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="theme">{t("theme")}</Label>
          <ThemeSwitcher />
        </div>
      </SettingsGroup>

      {/* Locale */}
      <SettingsGroup title={t("languageAndRegion")} description={t("languageAndRegionDescription")}>
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="locale">{t("locale")}</Label>
          <LocaleSwitcher />
        </div>
      </SettingsGroup>
    </div>
  );
}
