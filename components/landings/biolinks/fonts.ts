import { Inter, Roboto, Outfit, Playfair_Display, Space_Grotesk } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], display: "swap" });
export const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], display: "swap" });
export const outfit = Outfit({ subsets: ["latin"], display: "swap" });
export const playfair = Playfair_Display({ subsets: ["latin"], display: "swap" });
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });

export function getFontClass(fontFamily?: string) {
  switch (fontFamily?.toLowerCase()) {
    case "roboto":
      return roboto.className;
    case "outfit":
      return outfit.className;
    case "playfair":
      return playfair.className;
    case "space":
    case "space-grotesk":
      return spaceGrotesk.className;
    case "inter":
    default:
      return inter.className;
  }
}
