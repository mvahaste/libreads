"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LucideMoon, LucideSun, LucideSunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

type ThemeId = "system" | "light" | "dark";

type Theme = {
  id: ThemeId;
  icon: ReactNode;
};

const THEMES: Theme[] = [
  {
    id: "system",
    icon: <LucideSunMoon />,
  },
  {
    id: "light",
    icon: <LucideSun />,
  },
  {
    id: "dark",
    icon: <LucideMoon />,
  },
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings.themes");
  const [mounted, setMounted] = useState(false);

  // Only show theme switcher after mounting to prevent hydration mismatch
  useEffect(() => {
    const handleMount = () => setMounted(true);
    handleMount();
  }, []);

  const currentThemeId = mounted ? (theme ?? "system") : "system";

  return (
    <Select value={currentThemeId} onValueChange={(value) => setTheme(value)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.icon}
            {t(theme.id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
