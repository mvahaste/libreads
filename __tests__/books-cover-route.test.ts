import { DELETE, POST } from "@/app/api/books/cover/route";
import { BOOK_COVER } from "@/lib/constants";
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

describe("books cover route", () => {
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

    prismaMock.prisma.image.create.mockResolvedValue({ id: "image-1" });
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

  test("uploads cover for authenticated users", async () => {
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
    expect(await response.json()).toEqual({ imageId: "image-1" });
    expect(prismaMock.prisma.image.create).toHaveBeenCalledTimes(1);
  });

  test("rejects oversized cover before reading file bytes", async () => {
    const oversizedFile = new File([new Uint8Array(BOOK_COVER.MAX_SIZE + 1)], "cover.png", {
      type: "image/png",
    });

    const arrayBufferSpy = vi.spyOn(oversizedFile, "arrayBuffer");

    const formData = new FormData();
    formData.append("file", oversizedFile);

    const req = {
      headers: new Headers(),
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: "FILE_TOO_LARGE" });
    expect(arrayBufferSpy).not.toHaveBeenCalled();
    expect(prismaMock.prisma.image.create).not.toHaveBeenCalled();
  });

  test("deletes only unattached temporary images", async () => {
    const req = {
      headers: new Headers(),
      nextUrl: new URL("https://example.com/api/books/cover?imageId=temp-image-1"),
    } as unknown as NextRequest;

    const response = await DELETE(req);

    expect(response.status).toBe(204);
    expect(prismaMock.prisma.image.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "temp-image-1",
        books: { none: {} },
        users: { none: {} },
      },
    });
  });

  test("requires authenticated user for delete", async () => {
    authMock.getSession.mockResolvedValue(null);

    const req = {
      headers: new Headers(),
      nextUrl: new URL("https://example.com/api/books/cover?imageId=temp-image-1"),
    } as unknown as NextRequest;

    const response = await DELETE(req);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED" });
  });
});
