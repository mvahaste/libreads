import { DELETE, POST } from "@/app/api/books/cover-temp/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  prisma: {
    image: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: authMock.getSession,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock.prisma,
}));

describe("books temporary cover route", () => {
  beforeEach(() => {
    authMock.getSession.mockReset();
    prismaMock.prisma.image.create.mockReset();
    prismaMock.prisma.image.deleteMany.mockReset();

    authMock.getSession.mockResolvedValue({
      user: {
        id: "user-1",
        isAdmin: false,
      },
    });

    prismaMock.prisma.image.create.mockResolvedValue({ id: "image-temp-1" });
    prismaMock.prisma.image.deleteMany.mockResolvedValue({ count: 1 });
  });

  test("requires authenticated user for upload", async () => {
    authMock.getSession.mockResolvedValue(null);

    const req = {
      headers: new Headers(),
      formData: vi.fn(),
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED" });
  });

  test("uploads temporary cover for authenticated users", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "cover.png", {
      type: "image/png",
    });

    const formData = new FormData();
    formData.append("file", file);

    const req = {
      headers: new Headers(),
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ imageId: "image-temp-1" });
    expect(prismaMock.prisma.image.create).toHaveBeenCalledTimes(1);
  });

  test("deletes unattached temporary image", async () => {
    const req = {
      headers: new Headers(),
      nextUrl: new URL("https://example.com/api/books/cover-temp?imageId=image-temp-1"),
    } as unknown as NextRequest;

    const response = await DELETE(req);

    expect(response.status).toBe(204);
    expect(prismaMock.prisma.image.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "image-temp-1",
        books: { none: {} },
        users: { none: {} },
      },
    });
  });

  test("requires authenticated user for delete", async () => {
    authMock.getSession.mockResolvedValue(null);

    const req = {
      headers: new Headers(),
      nextUrl: new URL("https://example.com/api/books/cover-temp?imageId=image-temp-1"),
    } as unknown as NextRequest;

    const response = await DELETE(req);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED" });
  });
});
