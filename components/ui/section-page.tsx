"use client";

import { type NavGroup, SectionNav } from "./section-nav";

interface SectionPageProps<T extends string> {
  title: string;
  description: string;
  groups: NavGroup<T>[];
  children: React.ReactNode;
}

export function SectionPage<T extends string>(props: SectionPageProps<T>) {
  const { title, description, children, groups } = props;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight text-balance">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
      </div>

      {/* Top nav (Mobile) */}
      <div className="mb-6 lg:hidden">
        <SectionNav groups={groups} layout="mobile" />
      </div>

      <div className="flex gap-8 lg:gap-12">
        {/* Sidebar (Desktop) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-8">
            <SectionNav groups={groups} layout="desktop" />
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
