import { TemplateLevel, ThreePresetId } from "./contract";

/**
 * MINIWEBS THEME SYSTEM
 * 
 * Defines visual identities with zero technical exposure to the client.
 * Handles auto-contrast, color harmonies, lighting and tokens.
 */

export interface ThemeDefinition {
  id: string;
  name: string;
  marketingName: string;
  level: TemplateLevel;
  description: string;
  defaultPreset?: ThreePresetId;
  visuals: {
    bg: string;
    surface: string;
    surfaceElevated: string;
    surfaceGlass: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderHighlight: string;
    defaultPrimary: string;
    defaultSecondary: string;
    fontFamily: string;
    cardStyle: "clean" | "glass" | "bordered" | "editorial" | "glow";
    isDark: boolean;
  };
}

export const TEMPLATE_LEVEL_METADATA: Record<
  TemplateLevel,
  {
    name: string;
    marketingName: string;
    description: string;
    badge: string;
    tags: string[];
    allowedThemes: string[];
    supportsAnimations: boolean;
    supports3D: boolean;
  }
> = {
  classic: {
    name: "Classic",
    marketingName: "Classic",
    description: "Diseño limpio, rápido, elegante y extremadamente compatible.",
    badge: "Ultra Rápido",
    tags: ["Rápido", "Limpio", "Compatible"],
    allowedThemes: ["clean", "essential"],
    supportsAnimations: false,
    supports3D: false,
  },
  motion: {
    name: "Motion",
    marketingName: "Modern Motion",
    description: "Diseño moderno con animaciones suaves y microinteracciones fluidas.",
    badge: "Interactiva",
    tags: ["Dinámico", "Micro-animaciones", "Moderno"],
    allowedThemes: ["modern", "dynamic"],
    supportsAnimations: true,
    supports3D: false,
  },
  premium: {
    name: "Premium",
    marketingName: "Premium",
    description: "Experiencia visual de alta gama, tipografía editorial y componentes de lujo.",
    badge: "Alta Gama",
    tags: ["Lujo", "Editorial", "Exclusivo"],
    allowedThemes: ["luxury", "editorial", "minimal_luxury"],
    supportsAnimations: true,
    supports3D: false,
  },
  immersive: {
    name: "Immersive",
    marketingName: "Immersive 3D",
    description: "Experiencia visual envolvente de última generación con arte interactivo 3D.",
    badge: "3D Envolvente",
    tags: ["3D", "Innovador", "Vanguardia"],
    allowedThemes: ["flow", "immersive_dark", "organic", "particles"],
    supportsAnimations: true,
    supports3D: true,
  },
};

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  // ── CLASSIC LEVEL ──
  clean: {
    id: "clean",
    name: "Clean",
    marketingName: "Clean",
    level: "classic",
    description: "Limpio, simple y profesional con máximo enfoque en el contenido.",
    visuals: {
      bg: "#ffffff",
      surface: "#f8fafc",
      surfaceElevated: "#ffffff",
      surfaceGlass: "rgba(255, 255, 255, 0.95)",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      border: "#e2e8f0",
      borderHighlight: "#cbd5e1",
      defaultPrimary: "#2563eb",
      defaultSecondary: "#4f46e5",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "clean",
      isDark: false,
    },
  },
  essential: {
    id: "essential",
    name: "Essential",
    marketingName: "Essential Minimal",
    level: "classic",
    description: "Minimalismo contemporáneo, alto contraste y legibilidad absoluta.",
    visuals: {
      bg: "#09090b",
      surface: "#18181b",
      surfaceElevated: "#27272a",
      surfaceGlass: "rgba(24, 24, 27, 0.95)",
      textPrimary: "#fafafa",
      textSecondary: "#a1a1aa",
      textMuted: "#71717a",
      border: "#27272a",
      borderHighlight: "#3f3f46",
      defaultPrimary: "#f43f5e",
      defaultSecondary: "#fb7185",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "bordered",
      isDark: true,
    },
  },

  // ── MODERN MOTION LEVEL ──
  modern: {
    id: "modern",
    name: "Modern",
    marketingName: "Modern Motion",
    level: "motion",
    description: "Actual, dinámico y equilibrado con transiciones suaves.",
    visuals: {
      bg: "#0b0f19",
      surface: "#111827",
      surfaceElevated: "#1f2937",
      surfaceGlass: "rgba(17, 24, 39, 0.75)",
      textPrimary: "#f9fafb",
      textSecondary: "#9ca3af",
      textMuted: "#6b7280",
      border: "rgba(255, 255, 255, 0.08)",
      borderHighlight: "rgba(99, 102, 241, 0.4)",
      defaultPrimary: "#6366f1",
      defaultSecondary: "#ec4899",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glass",
      isDark: true,
    },
  },
  dynamic: {
    id: "dynamic",
    name: "Dynamic",
    marketingName: "Dynamic Motion",
    level: "motion",
    description: "Mayor energía visual, micro-interacciones activas y colores vibrantes.",
    visuals: {
      bg: "#0a0a0f",
      surface: "#13131f",
      surfaceElevated: "#1e1e30",
      surfaceGlass: "rgba(19, 19, 31, 0.8)",
      textPrimary: "#ffffff",
      textSecondary: "#a5b4fc",
      textMuted: "#6366f1",
      border: "rgba(99, 102, 241, 0.15)",
      borderHighlight: "rgba(168, 85, 247, 0.5)",
      defaultPrimary: "#8b5cf6",
      defaultSecondary: "#06b6d4",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glow",
      isDark: true,
    },
  },

  // ── PREMIUM LEVEL ──
  luxury: {
    id: "luxury",
    name: "Luxury",
    marketingName: "Luxury Gold",
    level: "premium",
    description: "Elegante, sofisticado y exclusivo con detalles dorados y sombras profundas.",
    visuals: {
      bg: "#0a0a0c",
      surface: "#121216",
      surfaceElevated: "#1c1c24",
      surfaceGlass: "rgba(18, 18, 22, 0.85)",
      textPrimary: "#fcfbf7",
      textSecondary: "#d1c7b7",
      textMuted: "#8e8677",
      border: "rgba(217, 180, 110, 0.2)",
      borderHighlight: "rgba(217, 180, 110, 0.6)",
      defaultPrimary: "#c5a059",
      defaultSecondary: "#dfba73",
      fontFamily: "'Playfair Display', serif",
      cardStyle: "editorial",
      isDark: true,
    },
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    marketingName: "Editorial Magazine",
    level: "premium",
    description: "Tipografía protagonista, composición asimétrica y estética de revista de alta costura.",
    visuals: {
      bg: "#faf8f5",
      surface: "#ffffff",
      surfaceElevated: "#f4efe9",
      surfaceGlass: "rgba(255, 255, 255, 0.9)",
      textPrimary: "#18181b",
      textSecondary: "#52525b",
      textMuted: "#a1a1aa",
      border: "#e7ded5",
      borderHighlight: "#18181b",
      defaultPrimary: "#09090b",
      defaultSecondary: "#b45309",
      fontFamily: "'Playfair Display', serif",
      cardStyle: "editorial",
      isDark: false,
    },
  },
  minimal_luxury: {
    id: "minimal_luxury",
    name: "Minimal Luxury",
    marketingName: "Minimal Luxury",
    level: "premium",
    description: "Lujo basado en la amplitud del espacio, sutileza y texturas refinadas.",
    visuals: {
      bg: "#0c0d10",
      surface: "#14161d",
      surfaceElevated: "#1d212b",
      surfaceGlass: "rgba(20, 22, 29, 0.8)",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
      textMuted: "#475569",
      border: "rgba(255, 255, 255, 0.08)",
      borderHighlight: "rgba(255, 255, 255, 0.25)",
      defaultPrimary: "#e2e8f0",
      defaultSecondary: "#38bdf8",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glass",
      isDark: true,
    },
  },

  // ── IMMERSIVE 3D LEVEL ──
  flow: {
    id: "flow",
    name: "Flow",
    marketingName: "Organic Flow 3D",
    level: "immersive",
    description: "Formas orgánicas tridimensionales en movimiento suave y relajante.",
    defaultPreset: "flow",
    visuals: {
      bg: "#060b13",
      surface: "#0c1322",
      surfaceElevated: "#131e36",
      surfaceGlass: "rgba(12, 19, 34, 0.7)",
      textPrimary: "#f0fdf4",
      textSecondary: "#86efac",
      textMuted: "#4ade80",
      border: "rgba(52, 211, 153, 0.2)",
      borderHighlight: "rgba(52, 211, 153, 0.6)",
      defaultPrimary: "#10b981",
      defaultSecondary: "#06b6d4",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glass",
      isDark: true,
    },
  },
  particles: {
    id: "particles",
    name: "Particles",
    marketingName: "Constellation Particles 3D",
    level: "immersive",
    description: "Partículas flotantes sutiles conectadas por constelaciones luminosas.",
    defaultPreset: "particles",
    visuals: {
      bg: "#05070e",
      surface: "#0d1120",
      surfaceElevated: "#161b33",
      surfaceGlass: "rgba(13, 17, 32, 0.7)",
      textPrimary: "#f8fafc",
      textSecondary: "#93c5fd",
      textMuted: "#3b82f6",
      border: "rgba(59, 130, 246, 0.25)",
      borderHighlight: "rgba(96, 165, 250, 0.7)",
      defaultPrimary: "#3b82f6",
      defaultSecondary: "#8b5cf6",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glow",
      isDark: true,
    },
  },
  immersive_dark: {
    id: "immersive_dark",
    name: "Dark Immersive",
    marketingName: "Dark Matrix 3D",
    level: "immersive",
    description: "Experiencia oscura, misteriosa y sofisticada con reflejos de malla poligonal.",
    defaultPreset: "luxury",
    visuals: {
      bg: "#030305",
      surface: "#0b0b10",
      surfaceElevated: "#14141c",
      surfaceGlass: "rgba(11, 11, 16, 0.8)",
      textPrimary: "#f4f4f5",
      textSecondary: "#a1a1aa",
      textMuted: "#52525b",
      border: "rgba(244, 63, 94, 0.25)",
      borderHighlight: "rgba(244, 63, 94, 0.7)",
      defaultPrimary: "#f43f5e",
      defaultSecondary: "#fb923c",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glow",
      isDark: true,
    },
  },
  organic: {
    id: "organic",
    name: "Organic",
    marketingName: "Natural Curves 3D",
    level: "immersive",
    description: "Curvas metabólicas y ondulaciones botánicas fluidas.",
    defaultPreset: "organic",
    visuals: {
      bg: "#0d090f",
      surface: "#18121d",
      surfaceElevated: "#251b2c",
      surfaceGlass: "rgba(24, 18, 29, 0.75)",
      textPrimary: "#faf5ff",
      textSecondary: "#d8b4fe",
      textMuted: "#a855f7",
      border: "rgba(168, 85, 247, 0.25)",
      borderHighlight: "rgba(192, 132, 252, 0.7)",
      defaultPrimary: "#c084fc",
      defaultSecondary: "#f472b6",
      fontFamily: "'Inter', sans-serif",
      cardStyle: "glass",
      isDark: true,
    },
  },
};

/**
 * Resolves a complete theme definition safely with fallback.
 */
export function getThemeDefinition(themeId?: string, level?: TemplateLevel): ThemeDefinition {
  if (themeId && THEME_REGISTRY[themeId]) {
    return THEME_REGISTRY[themeId];
  }

  // Fallback based on level
  if (level === "motion") return THEME_REGISTRY.modern;
  if (level === "premium") return THEME_REGISTRY.luxury;
  if (level === "immersive") return THEME_REGISTRY.flow;
  return THEME_REGISTRY.clean;
}

/**
 * Computes contrast ratio and determines if white or dark text is needed.
 */
export function getOptimalTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.length !== 6) return "#ffffff";

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Perceived luminance formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#ffffff";
}

/**
 * Generates dynamic CSS variables for standard styling.
 */
export function generateThemeVariables(
  theme: ThemeDefinition,
  customPrimary?: string,
  customSecondary?: string
): Record<string, string> {
  const primary = customPrimary || theme.visuals.defaultPrimary;
  const secondary = customSecondary || theme.visuals.defaultSecondary;
  const primaryText = getOptimalTextColor(primary);

  return {
    "--mw-bg": theme.visuals.bg,
    "--mw-surface": theme.visuals.surface,
    "--mw-surface-elevated": theme.visuals.surfaceElevated,
    "--mw-surface-glass": theme.visuals.surfaceGlass,
    "--mw-text-primary": theme.visuals.textPrimary,
    "--mw-text-secondary": theme.visuals.textSecondary,
    "--mw-text-muted": theme.visuals.textMuted,
    "--mw-border": theme.visuals.border,
    "--mw-border-highlight": theme.visuals.borderHighlight,
    "--mw-primary": primary,
    "--mw-primary-text": primaryText,
    "--mw-secondary": secondary,
    "--mw-font": theme.visuals.fontFamily,
  };
}
