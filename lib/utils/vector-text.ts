import opentype from "opentype.js";
import path from "path";
import fs from "fs";

let boldFont: opentype.Font | null = null;
let regularFont: opentype.Font | null = null;

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

function loadFonts() {
  if (!boldFont) {
    boldFont = loadFontFile("Inter-Bold.ttf");
  }
  if (!regularFont) {
    regularFont = loadFontFile("Inter-Regular.ttf");
  }
  return { bold: boldFont, regular: regularFont };
}

// Clean text to avoid non-renderable unicode characters (e.g. emojis that have no TTF glyph)
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
  anchor: "left" | "middle" | "right" = "middle"
): string {
  const text = cleanTextForFont(rawText);
  if (!text) return "";
  const fonts = loadFonts();
  const font = isBold ? (fonts.bold || fonts.regular) : (fonts.regular || fonts.bold);

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
  anchor: "left" | "middle" | "right" = "middle"
): string {
  return lines
    .map((line, idx) => {
      const y = startY + idx * lineHeight;
      return renderVectorText(line, x, y, fontSize, color, isBold, anchor);
    })
    .join("\n");
}
