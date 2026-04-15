"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutput } from "@/lib/trpc/routers/_app";
import { getAvatarFallback } from "@/lib/utils/avatar";
import { getImageUrl } from "@/lib/utils/image-utils";
import { useQuery } from "@tanstack/react-query";
import { LucidePlus, LucideSearch, LucideTrash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { SettingsGroup } from "../settings-group";
import { AddUserDialog } from "./add-user-dialog";
import { RemoveUserDialog } from "./remove-user-dialog";

export type UserListItem = RouterOutput["users"]["list"][number];

export function UsersSection() {
  const t = useTranslations("settings.users");
  const tFields = useTranslations("common.fields");
  const tStates = useTranslations("common.states");
  const format = useFormatter();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);

  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { data: users, isLoading } = useQuery(trpc.users.list.queryOptions());

  const filteredUsers =
    users?.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const isCurrentUser = (userId: string) => {
    return session?.user.id === userId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format.dateTime(date, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title={t("management")}
        description={t("managementDescription")}
        action={
          <Button onClick={() => setAddDialogOpen(true)}>
            <LucidePlus className="size-4" />
            {t("addUser")}
          </Button>
        }
      >
        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <LucideSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users table (Desktop) */}
        <div className="hidden sm:block">
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card">
                  <TableHead>{t("roles.user")}</TableHead>
                  <TableHead>{tFields("role")}</TableHead>
                  <TableHead>{t("tableJoined")}</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">{t("tableActions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={getImageUrl(user.avatarId)} />
                          <AvatarFallback className="text-[0.625rem]">{getAvatarFallback(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground text-sm font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {t(`roles.${user.isAdmin ? "admin" : "user"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {!isCurrentUser(user.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                          aria-label={`${t("removeUser")} ${user.name}`}
                        >
                          <LucideTrash2 className="size-4" />
                        </Button>
                      )}
                      {isCurrentUser(user.id) && (
                        <span className="text-muted-foreground mr-1 text-xs italic">{t("currentUser")}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                      {t("noUsersFound")}
                    </TableCell>
                  </TableRow>
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                      {tStates("loading")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Users cards (Mobile) */}
        <div className="flex flex-col gap-3 sm:hidden">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="border-border bg-card flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={getImageUrl(user.avatarId)} />
                  <AvatarFallback className="text-[0.75rem]">{getAvatarFallback(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground truncate text-sm font-medium">{user.name}</p>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {t(`roles.${user.isAdmin ? "admin" : "user"}`)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{user.email}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {t("joinedAt", { date: formatDate(user.createdAt) })}
                  </p>
                </div>
              </div>
              {!isCurrentUser(user.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setDeleteTarget(user)}
                  aria-label={`${t("removeUser")} ${user.name}`}
                >
                  <LucideTrash2 className="size-4" />
                </Button>
              )}
              {isCurrentUser(user.id) && (
                <span className="text-muted-foreground mr-1 shrink-0 text-xs italic">{t("currentUser")}</span>
              )}
            </div>
          ))}
          {!isLoading && filteredUsers.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">{t("noUsersFound")}</p>
          )}
          {isLoading && <p className="text-muted-foreground py-8 text-center text-sm">{tStates("loading")}</p>}
        </div>
      </SettingsGroup>

      {/* Remove user confirmation dialog */}
      <RemoveUserDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} />

      {/* Add user dialog */}
      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
