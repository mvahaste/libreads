import { BOOK_COVER } from "@/lib/constants";
import sharp from "sharp";

export interface ProcessImageOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeBytes: number;
}

export async function processBookCoverImage(
  inputBuffer: Buffer,
  options?: Partial<ProcessImageOptions>,
): Promise<Buffer> {
  const { maxWidth, maxHeight, maxSizeBytes } = {
    maxWidth: BOOK_COVER.MAX_WIDTH,
    maxHeight: BOOK_COVER.MAX_HEIGHT,
    maxSizeBytes: BOOK_COVER.MAX_SIZE,
    ...options,
  };

  const result = await sharp(inputBuffer)
    .resize({
      fit: "inside",
      width: maxWidth,
      height: maxHeight,
      withoutEnlargement: true,
    })
    .jpeg({ mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  if (result.info.size > maxSizeBytes) {
    throw new Error(`Processed image exceeds max size (${maxSizeBytes} bytes), has ${result.info.size} bytes`);
  }

  return Buffer.from(result.data) as Buffer;
}
