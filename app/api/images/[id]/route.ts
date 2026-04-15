import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/utils/api/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    return apiErrorResponse("NOT_FOUND", 404);
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
