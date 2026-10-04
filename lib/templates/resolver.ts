/**
 * UNIFIED TEMPLATE RESOLVER FOR MINIWEBS SAAS
 * 
 * Ensures 100% parity between public landings (app/[subdomain]/page.tsx)
 * and the dashboard live editor (components/dashboard/editor/LandingPreview.tsx).
 */

export type ResolvedTemplateKind =
  | "tienda"
  | "multilevel"
  | "barberia"
  | "taller"
  | "lavadero"
  | "cancha"
  | "menu"
  | "estetica"
  | "clinica"
  | "gimnasio"
  | "general";

const MULTILEVEL_VARIANTS = new Set([
  "classic",
  "clean",
  "essential",
  "motion",
  "modern",
  "dynamic",
  "premium",
  "luxury",
  "editorial",
  "minimal_luxury",
  "dark",
  "list",
  "immersive",
  "flow",
  "particles",
  "organic",
  "immersive_dark",
  "bento",
  "app_native",
  "lookbook",
]);

export function resolveTemplateKind(biz: {
  type?: string | null;
  layoutConfig?: any;
} | any): ResolvedTemplateKind {
  const layout = biz?.layoutConfig || {};
  const themeVariant = layout.themeVariant || "classic";
  const templateLevel = layout.templateLevel;
  const bizType = (biz?.type || "general").toLowerCase();

  // 1. Tienda Virtual E-commerce
  if (bizType === "tienda" || themeVariant === "tienda") {
    return "tienda";
  }

  // 2. Multi-level universal system (Classic / Motion / Premium / Immersive 3D)
  if (templateLevel || MULTILEVEL_VARIANTS.has(themeVariant)) {
    return "multilevel";
  }

  // 3. Legacy niche-specific templates
  if (bizType === "barberia") return "barberia";
  if (bizType === "taller") return "taller";
  if (bizType === "lavadero") return "lavadero";
  if (bizType === "cancha") return "cancha";
  if (bizType === "menu" || bizType === "restaurante") return "menu";
  if (bizType === "estetica") return "estetica";
  if (bizType === "clinica") return "clinica";
  if (bizType === "gimnasio") return "gimnasio";

  return "general";
}
