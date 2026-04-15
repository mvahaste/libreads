import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { describe, expect, test } from "vitest";

const t = ((key: string) => key) as unknown as ReturnType<typeof import("next-intl").useTranslations>;

describe("getAuthErrorMessage", () => {
  test("returns mapped translation key for known auth codes", () => {
    expect(getAuthErrorMessage("INVALID_EMAIL", t)).toBe("auth.INVALID_EMAIL");
    expect(getAuthErrorMessage("SIGN_UP_DISABLED", t)).toBe("auth.SIGN_UP_DISABLED");
  });

  test("falls back to unknown key for unmapped codes", () => {
    expect(getAuthErrorMessage("SOME_NEW_CODE", t)).toBe("unknown");
    expect(getAuthErrorMessage(undefined, t)).toBe("unknown");
  });
});
