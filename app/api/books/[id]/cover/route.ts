import { BOOK_COVER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  parseFormDataOrError,
  parseImageUploadOrError,
  parseRequiredSearchParamOrError,
  requireAdminOrError,
  requireSessionOrError,
} from "@/lib/utils/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export type BookCoverPostResponse = {
  imageId: string;
};

type BookCoverErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BOOK_NOT_FOUND"
  | "INVALID_FORM_DATA"
  | "INVALID_IMAGE_ID"
  | "NO_FILE_UPLOADED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED"
  | "DELETE_FAILED";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessionResult = await requireSessionOrError(req, "UNAUTHORIZED");
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const adminResult = requireAdminOrError(sessionResult.value, "FORBIDDEN");
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const bookExists = await prisma.book.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!bookExists) {
    return apiErrorResponse<BookCoverErrorCode>("BOOK_NOT_FOUND", 404);
  }

  const formDataResult = await parseFormDataOrError(req, "INVALID_FORM_DATA");
  if (!formDataResult.ok) {
    return formDataResult.response;
  }

  const uploadResult = await parseImageUploadOrError(formDataResult.value, {
    acceptedTypes: BOOK_COVER.ACCEPTED_TYPES,
    maxSize: BOOK_COVER.MAX_SIZE,
    noFileCode: "NO_FILE_UPLOADED",
    invalidTypeCode: "INVALID_FILE_TYPE",
    fileTooLargeCode: "FILE_TOO_LARGE",
  });
  if (!uploadResult.ok) {
    return uploadResult.response;
  }

  try {
    const image = await prisma.image.create({
      data: {
        mime: uploadResult.value.mime,
        data: uploadResult.value.bytes,
      },
      select: { id: true },
    });

    const result: BookCoverPostResponse = {
      imageId: image.id,
    };

    return NextResponse.json(result, { status: 201 });
  } catch {
    return apiErrorResponse<BookCoverErrorCode>("UPLOAD_FAILED", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessionResult = await requireSessionOrError(req, "UNAUTHORIZED");
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const adminResult = requireAdminOrError(sessionResult.value, "FORBIDDEN");
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const bookExists = await prisma.book.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!bookExists) {
    return apiErrorResponse<BookCoverErrorCode>("BOOK_NOT_FOUND", 404);
  }

  const imageIdResult = parseRequiredSearchParamOrError(req, "imageId", "INVALID_IMAGE_ID");
  if (!imageIdResult.ok) {
    return imageIdResult.response;
  }

  try {
    await prisma.image.deleteMany({
      where: {
        id: imageIdResult.value,
        books: { none: {} },
        users: { none: {} },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return apiErrorResponse<BookCoverErrorCode>("DELETE_FAILED", 500);
  }
}
