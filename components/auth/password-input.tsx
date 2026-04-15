"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { LucideEye, LucideEyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";

export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const t = useTranslations("auth.passwordInput");
  const [showPassword, setShowPassword] = useState(false);
  const Icon = showPassword ? LucideEyeOff : LucideEye;

  return (
    <div className="relative">
      <Input {...props} type={showPassword ? "text" : "password"} className={cn("pr-8", className)} />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="absolute inset-y-1/2 right-1 size-7 -translate-y-1/2"
        onClick={() => setShowPassword((p) => !p)}
        aria-label={showPassword ? t("hide") : t("show")}
        aria-pressed={showPassword}
      >
        <Icon className="size-4" />
        <span className="sr-only">{showPassword ? t("hide") : t("show")}</span>
      </Button>
    </div>
  );
}
