import { GoBackButton } from "@/components/ui/go-back-button";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("notFound");

  return (
    <div className="grid grow place-items-center">
      <div className="mb-12 text-center">
        <h2 className="text-xl font-bold">404</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <GoBackButton className="mt-4 cursor-pointer" variant="secondary">
          {t("goBack")}
        </GoBackButton>
      </div>
    </div>
  );
}
