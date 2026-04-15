import { GET } from "@/app/api/images/[id]/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  prisma: {
    image: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock.prisma,
}));

describe("images by id route", () => {
  beforeEach(() => {
    prismaMock.prisma.image.findUnique.mockReset();
  });

  test("returns standardized NOT_FOUND response when image is missing", async () => {
    prismaMock.prisma.image.findUnique.mockResolvedValue(null);

    const response = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "missing-image" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "NOT_FOUND" });
  });

  test("returns image bytes and cache headers when image exists", async () => {
    const bytes = Buffer.from([1, 2, 3]);
    prismaMock.prisma.image.findUnique.mockResolvedValue({
      id: "image-1",
      mime: "image/png",
      data: bytes,
    });

    const response = await GET({} as NextRequest, {
      params: Promise.resolve({ id: "image-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");

    const body = new Uint8Array(await response.arrayBuffer());
    expect([...body]).toEqual([1, 2, 3]);
  });
});
