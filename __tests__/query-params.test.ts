import { parseQueryParams } from "@/lib/utils/query-params";
import { describe, expect, test } from "vitest";

describe("parseQueryParams", () => {
  test("reads default values when params are missing", () => {
    const result = parseQueryParams(new URLSearchParams(), {
      page: { type: "number", default: 1 },
      q: { type: "string", default: "" },
    });

    expect(result).toEqual({ page: 1, q: "" });
  });

  test("parses number params and applies validation", () => {
    const result = parseQueryParams(new URLSearchParams("page=3"), {
      page: { type: "number", validate: (value) => value > 0 },
    });

    expect(result).toEqual({ page: 3 });
  });

  test("applies optional normalization for string params", () => {
    const result = parseQueryParams(new URLSearchParams("q=  Hello  "), {
      q: {
        type: "string",
        normalize: (value) => value.trim().toLowerCase(),
      },
    });

    expect(result).toEqual({ q: "hello" });
  });

  test("throws for missing required params", () => {
    expect(() =>
      parseQueryParams(new URLSearchParams(), {
        q: { type: "string", required: true },
      }),
    ).toThrow("Missing query parameter 'q'");
  });

  test("throws for invalid number values", () => {
    expect(() =>
      parseQueryParams(new URLSearchParams("page=abc"), {
        page: { type: "number" },
      }),
    ).toThrow("Invalid 'page' parameter");
  });
});
