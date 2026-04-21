import AuthForm from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { getSignUpEnabled } from "@/lib/utils/server/get-sign-up-enabled";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) redirect("/dashboard");

  if (!(await getSignUpEnabled())) redirect("/auth/sign-in");

  const t = await getTranslations("auth.signUp");

  return (
    <Card className="mx-auto w-full sm:max-w-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signUp" />
      </CardContent>
    </Card>
  );
}
