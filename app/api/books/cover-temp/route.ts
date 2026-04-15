import { BOOK_COVER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  parseFormDataOrError,
  parseImageUploadOrError,
  parseRequiredSearchParamOrError,
  requireSessionOrError,
} from "@/lib/utils/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export type TemporaryBookCoverPostResponse = {
  imageId: string;
};

type TemporaryBookCoverErrorCode =
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
    const image = await prisma.image.create({
      data: {
        mime: uploadResult.value.mime,
        data: uploadResult.value.bytes,
      },
      select: { id: true },
    });

    const result: TemporaryBookCoverPostResponse = {
      imageId: image.id,
    };

    return NextResponse.json(result, { status: 201 });
  } catch {
    return apiErrorResponse<TemporaryBookCoverErrorCode>("UPLOAD_FAILED", 500);
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
    return apiErrorResponse<TemporaryBookCoverErrorCode>("DELETE_FAILED", 500);
  }
}
