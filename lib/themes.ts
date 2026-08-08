export type BusinessType = 
  | "barberia" 
  | "estetica" 
  | "gimnasio" 
  | "menu" 
  | "cancha" 
  | "taller" 
  | "lavadero" 
  | "clinica" 
  | "general";

export interface ThemeConfig {
  bg: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  fontDisplay: string;
  border: string;
}

export const BUSINESS_THEMES: Record<BusinessType, ThemeConfig> = {
  barberia: {
    bg: "#141414",
    surface: "#1F1F1F",
    accent: "#C9A227",
    textPrimary: "#F2F2F0",
    textSecondary: "#A3A3A3",
    fontDisplay: "font-serif tracking-tight",
    border: "#333333",
  },
  estetica: {
    bg: "#FBF8F5",
    surface: "#FFFFFF",
    accent: "#B8917A",
    textPrimary: "#2E2A27",
    textSecondary: "#8A847C",
    fontDisplay: "font-serif",
    border: "#EAE1D9",
  },
  gimnasio: {
    bg: "#0A0A0A",
    surface: "#171717",
    accent: "#D7FF3C",
    textPrimary: "#FFFFFF",
    textSecondary: "#A3A3A3",
    fontDisplay: "font-sans font-black uppercase tracking-tighter",
    border: "#262626",
  },
  menu: {
    bg: "#FAF4EC",
    surface: "#FFFFFF",
    accent: "#C1461D",
    textPrimary: "#3A2E22",
    textSecondary: "#8C7A6B",
    fontDisplay: "font-serif",
    border: "#EADDCF",
  },
  cancha: {
    bg: "#0D1B12",
    surface: "#15281C",
    accent: "#3DDC84",
    textPrimary: "#EAF5EE",
    textSecondary: "#8FAD9D",
    fontDisplay: "font-sans font-bold",
    border: "#23402E",
  },
  taller: {
    bg: "#1A1A1A",
    surface: "#242424",
    accent: "#F2A93B",
    textPrimary: "#F0F0F0",
    textSecondary: "#A3A3A3",
    fontDisplay: "font-mono font-bold tracking-tight",
    border: "#404040",
  },
  lavadero: {
    bg: "#1A1A1A",
    surface: "#242424",
    accent: "#0ea5e9",
    textPrimary: "#F0F0F0",
    textSecondary: "#A3A3A3",
    fontDisplay: "font-sans font-bold",
    border: "#404040",
  },
  clinica: {
    bg: "#FBF8F5",
    surface: "#FFFFFF",
    accent: "#f87171",
    textPrimary: "#2E2A27",
    textSecondary: "#8A847C",
    fontDisplay: "font-sans",
    border: "#EAE1D9",
  },
  general: {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    accent: "#D9662B",
    textPrimary: "#211D18",
    textSecondary: "#7A7267",
    fontDisplay: "font-sans font-bold",
    border: "#EAE6DF",
  }
};

export function getTheme(type?: string | null): ThemeConfig {
  const validTypes = Object.keys(BUSINESS_THEMES);
  if (type && validTypes.includes(type)) {
    return BUSINESS_THEMES[type as BusinessType];
  }
  return BUSINESS_THEMES["general"];
}
