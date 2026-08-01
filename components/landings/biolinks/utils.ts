export function getContrastColor(hexcolor?: string | null): string {
  if (!hexcolor) return "white";
  let hex = hexcolor.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff"; // slate-900 or white
}

export function getTextColor(config: any): string {
  if (config.textColorMode === "light") return "#ffffff";
  if (config.textColorMode === "dark") return "#0f172a";

  if (config.backgroundType === "dark" || config.backgroundType === "image" || config.backgroundType === "video") {
    return "#ffffff";
  }
  
  if (config.backgroundType === "light") {
    return "#0f172a";
  }

  // If gradient, check primaryColor
  return getContrastColor(config.primaryColor || "#1e1b4b");
}
