"use client";

import PageHeader from "./page-header";
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
      <PageHeader title={title} description={description} />

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
