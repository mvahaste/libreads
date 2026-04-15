import { AVATAR } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  apiErrorResponse,
  parseFormDataOrError,
  parseImageUploadOrError,
  requireSessionOrError,
  requireSessionUserOrError,
} from "@/lib/utils/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export type AvatarPostResponse = {
  avatarId: string;
};

type AvatarErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FORM_DATA"
  | "NO_FILE_UPLOADED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessionResult = await requireSessionOrError(req, "UNAUTHORIZED");
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const ownerResult = requireSessionUserOrError(sessionResult.value, id, "UNAUTHORIZED");
  if (!ownerResult.ok) {
    return ownerResult.response;
  }

  const formDataResult = await parseFormDataOrError(req, "INVALID_FORM_DATA");
  if (!formDataResult.ok) {
    return formDataResult.response;
  }

  const uploadResult = await parseImageUploadOrError(formDataResult.value, {
    acceptedTypes: AVATAR.ACCEPTED_TYPES,
    maxSize: AVATAR.MAX_SIZE,
    noFileCode: "NO_FILE_UPLOADED",
    invalidTypeCode: "INVALID_FILE_TYPE",
    fileTooLargeCode: "FILE_TOO_LARGE",
  });
  if (!uploadResult.ok) {
    return uploadResult.response;
  }

  let newAvatarId: string;
  try {
    newAvatarId = await prisma.$transaction(async (tx) => {
      // Delete old avatar if exists
      if (sessionResult.value.user.avatarId) {
        await tx.image.delete({ where: { id: sessionResult.value.user.avatarId } }).catch(() => {});
      }

      // Create new avatar
      const newImage = await tx.image.create({
        data: {
          data: uploadResult.value.bytes,
          mime: uploadResult.value.mime,
        },
      });

      // Update user's avatarId
      await tx.user.update({
        where: { id: sessionResult.value.user.id },
        data: {
          avatarId: newImage.id,
        },
      });

      return newImage.id;
    });
  } catch {
    return apiErrorResponse<AvatarErrorCode>("UPLOAD_FAILED", 500);
  }

  const result: AvatarPostResponse = {
    avatarId: newAvatarId,
  };

  return NextResponse.json(result, { status: 201 });
}
