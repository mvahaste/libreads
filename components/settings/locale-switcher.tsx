"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALLOWED_LOCALES, AllowedLocale } from "@/lib/constants";
import { setLocale } from "@/lib/utils/server/set-locale";
import { LucideLanguages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LocaleSwitcher() {
  const t = useTranslations("settings.locales");
  const currentLocale = useLocale() as AllowedLocale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: string) {
    if (locale === currentLocale) return;

    startTransition(async () => {
      await setLocale(locale as AllowedLocale);
      router.refresh();
    });
  }

  return (
    <Select value={currentLocale} onValueChange={handleSelect} disabled={isPending}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALLOWED_LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale}>
            <LucideLanguages />
            {t(locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
