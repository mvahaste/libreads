"use client";

import { IsbnScanFlow } from "@/components/browse/add-books/isbn-scan-flow";
import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { useTranslations } from "next-intl";

export default function IsbnScanPage() {
  const t = useTranslations("browse.add-books.scan-flow");

  return (
    <div>
      <BrowseSectionHeader title={t("title")} description={t("description")} />
      <IsbnScanFlow />
    </div>
  );
}
