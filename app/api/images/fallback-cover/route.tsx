import { parseQueryParams } from "@/lib/utils/query-params";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const themes = {
  light: {
    bg: "#f5f0e8",
    surface: "#ede7db",
    fg: "#2c2420",
    muted: "#8b7e70",
    accent: "#7a5a38",
    rule: "#b8a890",
  },
  dark: {
    bg: "#1c1917",
    surface: "#272220",
    fg: "#f0ebe4",
    muted: "#978a7e",
    accent: "#b08860",
    rule: "#4a3f35",
  },
};

let fontRegular: ArrayBuffer;
let fontBold: ArrayBuffer;

// Load fonts at module level so they don't have to be loaded on every request
async function loadFonts() {
  if (!fontRegular || !fontBold) {
    const fontDir = join(process.cwd(), "public", "fonts");

    // Read font files as buffers
    const [bufRegular, bufBold] = await Promise.all([
      readFile(join(fontDir, "lora-500.woff")),
      readFile(join(fontDir, "lora-600.woff")),
    ]);

    // Convert to ArrayBuffer
    fontRegular = bufRegular.buffer.slice(bufRegular.byteOffset, bufRegular.byteOffset + bufRegular.byteLength);
    fontBold = bufBold.buffer.slice(bufBold.byteOffset, bufBold.byteOffset + bufBold.byteLength);
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const { title, subtitle, theme } = parseQueryParams(searchParams, {
    title: {
      type: "string",
      default: "",
    },
    subtitle: {
      type: "string",
      default: "",
    },
    theme: {
      type: "string",
      default: "light",
      validate: (value: string) => ["light", "dark"].includes(value),
    },
  });

  await loadFonts();

  const colors = themes[theme as "light" | "dark"];

  const titleFontSize = title.length > 60 ? 22 : title.length > 30 ? 26 : 32;

  const Decoration = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "32px 0" }}>
      <div style={{ width: "60px", height: "1px", backgroundColor: colors.rule }} />
      <div style={{ width: "6px", height: "6px", backgroundColor: colors.accent, transform: "rotate(45deg)" }} />
      <div style={{ width: "60px", height: "1px", backgroundColor: colors.rule }} />
    </div>
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
        fontFamily: "Lora",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.surface,
          padding: "40px 32px",
        }}
      >
        {(title || subtitle) && <Decoration />}

        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 600,
            color: colors.fg,
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "300px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {title || subtitle || "-"}
        </div>

        {subtitle && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: colors.muted,
              textAlign: "center",
              maxWidth: "280px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {subtitle}
          </div>
        )}

        {(title || subtitle) && <Decoration />}
      </div>
    </div>,
    {
      width: 400,
      height: 600,
      fonts: [
        { name: "Lora", data: fontRegular, weight: 500 as const, style: "normal" as const },
        { name: "Lora", data: fontBold, weight: 600 as const, style: "normal" as const },
      ],
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
      },
    },
  );
}
