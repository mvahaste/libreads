"use client";

import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { Button } from "@/components/ui/button";
import { IconCard } from "@/components/ui/icon-card";
import { LucideDownload, LucidePlus, LucideScanBarcode } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ImportPage() {
  const t = useTranslations("browse.add-books");

  return (
    <div>
      <BrowseSectionHeader title={t("title")} description={t("description")} />

      <div className="space-y-4">
        <IconCard
          icon={<LucideDownload className="text-primary size-5" />}
          title={t("import.title")}
          description={t("import.description")}
          action={
            <Button asChild variant="secondary">
              <Link href="/browse/add-books/hardcover">{t("import.action")}</Link>
            </Button>
          }
        />
        <IconCard
          icon={<LucideScanBarcode className="text-primary size-5" />}
          title={t("scan.title")}
          description={t("scan.description")}
          action={
            <Button asChild variant="secondary">
              <Link href="/browse/add-books/scan">{t("scan.action")}</Link>
            </Button>
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
