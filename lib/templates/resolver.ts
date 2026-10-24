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
  | "el_patron"
  | "taller"
  | "lavadero"
  | "cancha"
  | "menu"
  | "trompo"
  | "estetica"
  | "clinica"
  | "gimnasio"
  | "unas"
  | "dental"
  | "veterinaria"
  | "urban_fade"
  | "cantina_gourmet"
  | "glitz_lash"
  | "holistic_spa"
  | "pet_resort"
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

  // 1.5. Plantillas especializadas mexicanas y nuevos rubros (Par 1 y Par 2 de cada rubro)
  // Barbería
  if (themeVariant === "urban_fade" || themeVariant === "fade_studio") return "urban_fade";
  if (themeVariant === "el_patron") return "el_patron";

  // Comida / Gastronomía
  if (themeVariant === "cantina_gourmet" || themeVariant === "gastrobar") return "cantina_gourmet";
  if (themeVariant === "el_trompo" || themeVariant === "trompo") return "trompo";

  // Uñas & Belleza
  if (themeVariant === "glitz_lash" || themeVariant === "glam_lash") return "glitz_lash";
  if (themeVariant === "unas" || bizType === "unas" || bizType === "lashista") return "unas";

  // Salud / Dental
  if (themeVariant === "holistic_spa" || themeVariant === "dental_spa") return "holistic_spa";
  if (themeVariant === "dental" || bizType === "dental" || bizType === "dentista") return "dental";

  // Mascotas / Veterinaria
  if (themeVariant === "pet_resort" || themeVariant === "hotel_canino") return "pet_resort";
  if (themeVariant === "veterinaria" || bizType === "veterinaria" || bizType === "mascotas") return "veterinaria";

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
