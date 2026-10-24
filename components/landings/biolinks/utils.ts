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

export function formatSocialUrl(platform: "instagram" | "tiktok" | "facebook" | "twitter" | "youtube" | "whatsapp", handleOrUrl?: string | null): string {
  if (!handleOrUrl) return "#";
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return "#";
  
  if (platform === "whatsapp") {
    if (trimmed.includes("wa.me") || trimmed.includes("whatsapp.com")) {
      return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    }
    const cleanNumber = trimmed.replace(/\D/g, "");
    return `https://wa.me/${cleanNumber}`;
  }

  if (trimmed.includes(".com") || trimmed.includes("http://") || trimmed.includes("https://")) {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.replace("@", "");
  
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    case "facebook":
      return `https://facebook.com/${cleanHandle}`;
    default:
      return `https://${trimmed}`;
  }
}
