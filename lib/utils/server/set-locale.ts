"use server";

import type { AllowedLocale } from "@/lib/constants";
import { cookies } from "next/headers";

export async function setLocale(locale: AllowedLocale) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "locale",
    value: locale,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
