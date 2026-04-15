"use client";

import { authClient } from "@/lib/auth/auth-client";
import { NAV_LINKS } from "@/lib/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const t = useTranslations("nav");

  if (!session) return null;

  const isCurrentPath = (key: string) => {
    const basePath = pathname.split("/")[1];
    return basePath === key;
  };

  return (
    <div className="bg-card supports-backdrop-filter:bg-card/80 sticky bottom-0 z-50 block border-t px-4 py-3 shadow-sm supports-backdrop-filter:backdrop-blur sm:hidden">
      <nav className="flex flex-row items-center justify-between gap-2">
        {NAV_LINKS.map(({ key, icon: Icon, url }) => (
          <Link
            key={key}
            href={url}
            className={`flex flex-col items-center justify-center gap-1 ${isCurrentPath(key) ? "text-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{t(key)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
