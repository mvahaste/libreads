"use client";

import { authClient } from "@/lib/auth/auth-client";
import { NAV_LINKS } from "@/lib/constants";
import { getAvatarFallback } from "@/lib/utils/avatar";
import { getImageUrl } from "@/lib/utils/image-utils";
import { LucideLogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import LocaleSwitcher from "../settings/locale-switcher";
import ThemeSwitcher from "../settings/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function TopNav() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");

  if (!session)
    return (
      <div className="flex flex-row items-center gap-2">
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
    );

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in");
        },
        onError: (error) => {
          toast.error(error.error.message || tErrors("unknown"));
        },
      },
    });
  }

  const isCurrentPath = (key: string) => {
    const basePath = pathname.split("/")[1];
    return basePath === key;
  };

  return (
    <nav className="flex flex-row items-center justify-center gap-1">
      {NAV_LINKS.map(({ key, icon: Icon, url }) => (
        <Button
          key={key}
          asChild
          className="hidden sm:inline-flex"
          variant={isCurrentPath(key) ? "secondary" : "ghost"}
        >
          <Link href={url}>
            <Icon />
            <span>{tNav(key)}</span>
          </Link>
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Avatar className="size-6">
              <AvatarImage src={getImageUrl(session.user.avatarId)} />
              <AvatarFallback className="text-[0.5rem]">{getAvatarFallback(session.user.name)}</AvatarFallback>
            </Avatar>
            <span>{session.user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LucideLogOut />
              <span>{tActions("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
