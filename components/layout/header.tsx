import { LucideLibraryBig } from "lucide-react";
import Link from "next/link";

import TopNav from "./top-nav";

export default async function Header() {
  return (
    <header className="bg-card supports-backdrop-filter:bg-card/80 sticky top-0 z-50 border-b supports-backdrop-filter:backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="inline-flex flex-row items-center justify-center gap-1 text-base font-medium tracking-tight"
        >
          <LucideLibraryBig className="size-4" />
          <span>Libreads</span>
        </Link>
        <TopNav />
      </div>
    </header>
  );
}
