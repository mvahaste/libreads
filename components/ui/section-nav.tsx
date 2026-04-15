"use client";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "./button";
import { Separator } from "./separator";

export interface NavItem<T extends string> {
  id: T;
  icon: React.ReactNode;
  label: string;
  href?: string;
  variant?: "destructive";
  badge?: React.ReactNode;
}

export interface NavGroup<T extends string> {
  label: string;
  items: NavItem<T>[];
}

interface SectionNavProps<T extends string> {
  groups: NavGroup<T>[];
  layout: "desktop" | "mobile";
}

export function SectionNav<T extends string>(props: SectionNavProps<T>) {
  const { groups, layout } = props;
  const isDesktop = layout === "desktop";
  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-1", isDesktop ? "flex-col" : "scrollbar-none w-full overflow-x-auto pb-1")}>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className={cn(isDesktop ? "flex flex-col gap-1" : "flex gap-1")}>
          {isDesktop && groupIndex > 0 && <Separator className="my-2" />}
          {isDesktop && (
            <span className="text-muted-foreground px-3 pt-1 pb-0.5 text-[0.625rem] font-semibold tracking-wider uppercase">
              {group.label}
            </span>
          )}
          {group.items.map((item) => {
            const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

            return (
              <Button
                key={item.id}
                variant={isActive ? (item.variant === "destructive" ? "destructive" : "secondary") : "ghost"}
                size="lg"
                asChild
                className={cn("justify-start", !isDesktop && "whitespace-nowrap")}
              >
                <Link href={item.href!}>
                  {item.icon}
                  {item.label}
                  {isDesktop && item.badge}
                </Link>
              </Button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
