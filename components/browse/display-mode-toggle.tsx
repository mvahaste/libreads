"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DisplayMode } from "@/hooks/use-display-preferences";
import { LucideGrid2X2, LucideGrid3X3, LucideIcon, LucideRows3, LucideSquare } from "lucide-react";
import { useTranslations } from "next-intl";

interface DisplayModeToggleProps {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  availableModes?: DisplayMode[];
}

const MODES: {
  mode: DisplayMode;
  Icon: LucideIcon;
  labelKey: "display.default" | "display.list" | "display.compact" | "display.cover";
}[] = [
  { mode: "default", Icon: LucideSquare, labelKey: "display.default" },
  { mode: "compact", Icon: LucideGrid2X2, labelKey: "display.compact" },
  { mode: "cover", Icon: LucideGrid3X3, labelKey: "display.cover" },
  { mode: "list", Icon: LucideRows3, labelKey: "display.list" },
];

const DEFAULT_AVAILABLE_MODES: DisplayMode[] = ["default", "compact", "list"];

export function DisplayModeToggle({
  value,
  onChange,
  availableModes = DEFAULT_AVAILABLE_MODES,
}: DisplayModeToggleProps) {
  const t = useTranslations("browse");

  const filteredModes = MODES.filter(({ mode }) => availableModes.includes(mode));

  return (
    <TooltipProvider>
      <ButtonGroup>
        {filteredModes.map(({ mode, Icon, labelKey }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button variant={value === mode ? "secondary" : "outline"} onClick={() => onChange(mode)}>
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t(labelKey)}</TooltipContent>
          </Tooltip>
        ))}
      </ButtonGroup>
    </TooltipProvider>
  );
}
