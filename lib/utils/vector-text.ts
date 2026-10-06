import opentype from "opentype.js";
import path from "path";
import fs from "fs";
import { FlyerFontFamily, FontOption, FLYER_FONTS } from "./flyer-fonts";

export type { FlyerFontFamily, FontOption };
export { FLYER_FONTS };

const fontCache: Partial<Record<FlyerFontFamily | "inter_regular", opentype.Font>> = {};

const FONT_FILENAMES: Record<FlyerFontFamily, string> = {
  inter: "Inter-Bold.ttf",
  bebas: "BebasNeue.ttf",
  anton: "Anton.ttf",
  cinzel: "Cinzel.ttf",
  playfair: "PlayfairDisplay.ttf",
  orbitron: "Orbitron.ttf",
  montserrat: "Montserrat.ttf",
  russo: "RussoOne.ttf",
};

function loadFontFile(filename: string): opentype.Font | null {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", filename),
    path.join(process.cwd(), "lib", "fonts", filename),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const buf = fs.readFileSync(/*turbopackIgnore: true*/ p);
        return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }
    } catch (e) {
      console.warn("Failed to load font from", p, e);
    }
  }
  return null;
}

export function getFont(fontFamily: FlyerFontFamily = "inter", isBold = true): opentype.Font | null {
  if (fontFamily === "inter" && !isBold) {
    if (!fontCache.inter_regular) {
      const f = loadFontFile("Inter-Regular.ttf");
      if (f) fontCache.inter_regular = f;
    }
    if (fontCache.inter_regular) return fontCache.inter_regular;
  }

  const key = fontFamily;
  if (!fontCache[key]) {
    const filename = FONT_FILENAMES[key] || "Inter-Bold.ttf";
    const f = loadFontFile(filename);
    if (f) fontCache[key] = f;
  }

  // Fallback a Inter si la fuente solicitada no cargara
  if (!fontCache[key] && key !== "inter") {
    if (!fontCache.inter) {
      const f = loadFontFile("Inter-Bold.ttf");
      if (f) fontCache.inter = f;
    }
    return fontCache.inter || null;
  }

  return fontCache[key] || null;
}

// Clean text to avoid non-renderable unicode characters (e.g. emojis or special symbols)
function cleanTextForFont(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[★☆✦✧✪✫✬✭✮✯✰]/g, "")
    .trim();
}

/**
 * Converts a text string directly into an SVG <path d="..." /> using TrueType glyph outlines.
 * Completely immune to missing server fonts (no tofu / squares) on Vercel, Docker, or AWS.
 */
export function renderVectorText(
  rawText: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  isBold = true,
  anchor: "left" | "middle" | "right" = "middle",
  fontFamily: FlyerFontFamily = "inter"
): string {
  const text = cleanTextForFont(rawText);
  if (!text) return "";
  const font = getFont(fontFamily, isBold);

  if (!font) {
    return "";
  }

  let startX = x;
  if (anchor === "middle" || anchor === "right") {
    try {
      const width = font.getAdvanceWidth(text, fontSize);
      if (anchor === "middle") {
        startX = x - width / 2;
      } else {
        startX = x - width;
      }
    } catch {
      startX = x;
    }
  }

  try {
    const fullPath = new (opentype as any).Path();
    font.forEachGlyph(text, startX, y, fontSize, {}, (glyph: any, gx: number, gy: number, size: number) => {
      // Index 0 or .notdef represents missing glyphs that draw the tofu square boxes.
      // Skipping them ensures zero square boxes are ever rendered.
      if (glyph && glyph.index > 0 && glyph.name !== ".notdef") {
        fullPath.extend(glyph.getPath(gx, gy, size));
      }
    });

    const d = fullPath.toPathData(2);
    if (!d) return "";
    return `<path d="${d}" fill="${color}" />`;
  } catch (err) {
    console.warn("renderVectorText error:", err);
    return "";
  }
}

/**
 * Converts multiple lines of text into SVG <path> elements with accurate line-height spacing.
 */
export function renderVectorTextLines(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  fontSize: number,
  color: string,
  isBold = true,
  anchor: "left" | "middle" | "right" = "middle",
  fontFamily: FlyerFontFamily = "inter"
): string {
  return lines
    .map((line, idx) => {
      const y = startY + idx * lineHeight;
      return renderVectorText(line, x, y, fontSize, color, isBold, anchor, fontFamily);
    })
    .join("\n");
}
