"use client";

import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { Button } from "@/components/ui/button";
import { IconCard } from "@/components/ui/icon-card";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { LucideDownload, LucidePlus, LucideScanBarcode } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ImportPage() {
  const t = useTranslations("browse.add-books");
  const trpc = useTRPC();

  const { data: hardcoverStatus } = useQuery(trpc.hardcover.status.queryOptions());

  const isHardcoverConfigured = hardcoverStatus?.configured ?? true;

  return (
    <div>
      <BrowseSectionHeader title={t("title")} description={t("description")} />

      <div className="space-y-4">
        <IconCard
          icon={<LucideDownload className="text-primary size-5" />}
          title={t("import.title")}
          description={
            isHardcoverConfigured
              ? t("import.description")
              : `${t("import.description")} ${t("import-flow.api-token-missing")}`
          }
          action={
            isHardcoverConfigured ? (
              <Button asChild variant="secondary">
                <Link href="/browse/add-books/hardcover">{t("import.action")}</Link>
              </Button>
            ) : (
              <Button disabled variant="secondary">
                {t("import.action")}
              </Button>
            )
          }
        />
        <IconCard
          icon={<LucideScanBarcode className="text-primary size-5" />}
          title={t("scan.title")}
          description={
            isHardcoverConfigured
              ? t("scan.description")
              : `${t("scan.description")} ${t("scan-flow.api-token-missing")}`
          }
          action={
            isHardcoverConfigured ? (
              <Button asChild variant="secondary">
                <Link href="/browse/add-books/scan">{t("scan.action")}</Link>
              </Button>
            ) : (
              <Button disabled variant="secondary">
                {t("scan.action")}
              </Button>
            )
          }
        />
        <IconCard
          icon={<LucidePlus className="text-primary size-5" />}
          title={t("manual.title")}
          description={t("manual.description")}
          action={
            <Button asChild variant="secondary">
              <Link href="/browse/add-books/manual">{t("manual.action")}</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
