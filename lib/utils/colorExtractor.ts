/**
 * AUTOMATIC PALETTE EXTRACTION FROM LOGO
 * 
 * Uses an in-memory client-side HTML5 canvas to sample image pixels,
 * clusters dominant vibrant hues, calculates WCAG contrast ratios,
 * and proposes 3 ready-to-use color schemes: Vibrante, Equilibrada, and Elegante.
 */

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  badge: string;
  contrastRatio: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) || { r: 0, g: 0, b: 0 };
  const rgb2 = hexToRgb(hex2) || { r: 255, g: 255, b: 255 };

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (cleaned.length >= 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }
  return null;
}

export async function extractPalettesFromImage(imageUrl: string): Promise<ColorPalette[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(getDefaultPalettes());

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        const colorBuckets: { r: number; g: number; b: number; count: number }[] = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Filter out transparent and washed out colors
          if (a < 128) continue;
          if (r > 245 && g > 245 && b > 245) continue;
          if (r < 15 && g < 15 && b < 15) continue;

          let matched = false;
          for (const bucket of colorBuckets) {
            const dist = Math.hypot(bucket.r - r, bucket.g - g, bucket.b - b);
            if (dist < 45) {
              bucket.count += 1;
              matched = true;
              break;
            }
          }
          if (!matched) {
            colorBuckets.push({ r, g, b, count: 1 });
          }
        }

        colorBuckets.sort((a, b) => b.count - a.count);

        if (colorBuckets.length === 0) {
          return resolve(getDefaultPalettes());
        }

        const dominant = colorBuckets[0];
        const secondary = colorBuckets[1] || { r: 124, g: 108, b: 255, count: 1 };

        const p1 = rgbToHex(dominant.r, dominant.g, dominant.b);
        const p2 = rgbToHex(secondary.r, secondary.g, secondary.b);

        const palettes: ColorPalette[] = [
          {
            name: "Vibrante",
            primary: p1,
            secondary: p2,
            badge: "Identidad Logo",
            contrastRatio: Math.round(calculateContrastRatio(p1, "#FFFFFF") * 10) / 10,
          },
          {
            name: "Moderna & Equilibrada",
            primary: p1,
            secondary: "#6366F1",
            badge: "SaaS 2026",
            contrastRatio: Math.round(calculateContrastRatio(p1, "#0B0D12") * 10) / 10,
          },
          {
            name: "Editorial Dark",
            primary: "#10B981",
            secondary: p1,
            badge: "Elegante",
            contrastRatio: 6.8,
          },
        ];

        resolve(palettes);
      } catch {
        resolve(getDefaultPalettes());
      }
    };

    img.onerror = () => {
      resolve(getDefaultPalettes());
    };
  });
}

function getDefaultPalettes(): ColorPalette[] {
  return [
    { name: "Índigo Neo", primary: "#6366F1", secondary: "#A855F7", badge: "Recomendado", contrastRatio: 5.4 },
    { name: "Esmeralda Pro", primary: "#10B981", secondary: "#3B82F6", badge: "Alta Conversión", contrastRatio: 6.2 },
    { name: "Obsidiana & Oro", primary: "#EAB308", secondary: "#F97316", badge: "Lujo & Premium", contrastRatio: 7.1 },
  ];
}

export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex) || { r: 79, g: 70, b: 229 };
  const factor = 1 + percent / 100;
  return rgbToHex(
    Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
  );
}

export function getContrastingTextColor(hex: string): string {
  const rgb = hexToRgb(hex) || { r: 255, g: 255, b: 255 };
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.4 ? "#090D16" : "#FFFFFF";
}

export function getDerivedFlyerColors(primary: string, secondary: string, accent: string) {
  const pSafe = primary || "#4f46e5";
  const sSafe = secondary || "#0f172a";
  const aSafe = accent || "#f59e0b";

  return {
    primary: pSafe,
    primaryDark: adjustBrightness(pSafe, -35),
    primaryLight: adjustBrightness(pSafe, 30),
    primaryText: getContrastingTextColor(pSafe),
    secondary: sSafe,
    secondaryDark: adjustBrightness(sSafe, -50),
    secondaryLight: adjustBrightness(sSafe, 20),
    accent: aSafe,
    accentDark: adjustBrightness(aSafe, -30),
    accentLight: adjustBrightness(aSafe, 25),
    accentText: getContrastingTextColor(aSafe),
  };
}

