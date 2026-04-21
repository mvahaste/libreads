import { BOOK_COVER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  parseFormDataOrError,
  parseImageUploadOrError,
  parseRequiredSearchParamOrError,
  requireSessionOrError,
} from "@/lib/utils/api/route-helpers";
import { processBookCoverImage } from "@/lib/utils/process-image";
import { NextRequest, NextResponse } from "next/server";

export type BookCoverPostResponse = {
  imageId: string;
};

type BookCoverErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FORM_DATA"
  | "INVALID_IMAGE_ID"
  | "NO_FILE_UPLOADED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED"
  | "DELETE_FAILED";

export async function POST(req: NextRequest) {
  const sessionResult = await requireSessionOrError(req, "UNAUTHORIZED");
  if (!sessionResult.ok) {
    return sessionResult.response;
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
    const processed = await processBookCoverImage(Buffer.from(uploadResult.value.bytes));
    const image = await prisma.image.create({
      data: {
        mime: "image/jpeg",
        data: processed as never,
      },
      select: { id: true },
    });

    return NextResponse.json({ imageId: image.id } satisfies BookCoverPostResponse, { status: 201 });
  } catch {
    return apiErrorResponse<BookCoverErrorCode>("UPLOAD_FAILED", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const sessionResult = await requireSessionOrError(req, "UNAUTHORIZED");
  if (!sessionResult.ok) {
    return sessionResult.response;
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
