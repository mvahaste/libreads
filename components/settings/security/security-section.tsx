"use client";

import { useTranslations } from "next-intl";

import { SettingsGroup } from "../settings-group";
import ChangePassword from "./change-password";

export function SecuritySection() {
  const t = useTranslations("settings.security");
  const tFields = useTranslations("common.fields");

  return (
    <SettingsGroup title={tFields("password")} description={t("passwordDescription")}>
      <ChangePassword />
    </SettingsGroup>
  );
}
