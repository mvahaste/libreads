"use client";

import { HardcoverImportFlow } from "@/components/browse/add-books/hardcover-import-flow";
import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { useTranslations } from "next-intl";

export default function HardcoverImportPage() {
  const t = useTranslations("browse.add-books.import-flow");

  return (
    <div>
      <BrowseSectionHeader title={t("title")} description={t("description")} />
      <HardcoverImportFlow />
    </div>
  );
}
