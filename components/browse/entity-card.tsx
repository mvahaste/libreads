"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LucideEllipsisVertical, LucidePencilLine, LucideTrash2 } from "lucide-react";
import Link from "next/link";

export interface EntityCardAction {
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface EntityCardActions {
  manageLabel: string;
  edit?: EntityCardAction;
  delete?: EntityCardAction;
}

interface EntityCardProps {
  name: string;
  href: string;
  actions?: EntityCardActions;
}

export function EntityCard({ name, href, actions }: EntityCardProps) {
  const hasActions = Boolean(actions?.edit || actions?.delete);

  if (!hasActions) {
    return (
      <Link
        href={href}
        className="border-border bg-card animate-in fade-in group flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3"
      >
        <p className="text-foreground min-w-0 truncate text-sm font-medium transition-opacity group-hover:opacity-75">
          {name}
        </p>
      </Link>
    );
  }

  return (
    <div className="border-border bg-card animate-in fade-in flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3">
      <Link href={href} className="group min-w-0 flex-1">
        <p className="text-foreground min-w-0 truncate text-sm font-medium transition-opacity group-hover:opacity-75">
          {name}
        </p>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label={actions?.manageLabel}>
            <LucideEllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          {actions?.edit ? (
            <DropdownMenuItem disabled={actions.edit.disabled} onSelect={() => actions.edit?.onSelect?.()}>
              <LucidePencilLine />
              {actions.edit.label}
            </DropdownMenuItem>
          ) : null}

          {actions?.delete ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={actions.delete.disabled}
              onSelect={() => actions.delete?.onSelect?.()}
            >
              <LucideTrash2 />
              {actions.delete.label}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
