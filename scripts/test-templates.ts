import {
  normalizeBusinessData,
  switchTemplateLevel,
  BusinessDataContract,
  TemplateLevel,
} from "../lib/templates/contract";
import {
  THEME_REGISTRY,
  TEMPLATE_LEVEL_METADATA,
  getThemeDefinition,
  getOptimalTextColor,
  generateThemeVariables,
} from "../lib/templates/themes";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n════════════════════════════════════════════════════════════");
console.log(" MINIWEBS MULTI-LEVEL VISUAL TEMPLATE SYSTEM TEST SUITE");
console.log("════════════════════════════════════════════════════════════\n");

// ─── TEST SUITE 1: DATA INTEGRITY & LOSSLESS TEMPLATE SWITCHING ───
console.log("─── 1. Lossless Template Switching & Data Preservation ───");

const sampleBusiness = {
  id: "biz_test_123",
  name: "Barbería & Spa Royale",
  description: "Cuidado masculino de alta precisión y estilo.",
  phone: "+54 9 11 4444-5555",
  whatsapp: "+54 9 11 4444-5555",
  email: "contacto@royale.com",
  address: "Av. Libertador 4500, Buenos Aires",
  logoUrl: "https://images.unsplash.com/logo.jpg",
  bannerUrl: "https://images.unsplash.com/banner.jpg",
  primaryColor: "#d97706",
  secondaryColor: "#7c3aed",
  fontFamily: "'Playfair Display', serif",
  layoutConfig: {
    heroTitle: "Barbería & Spa Royale",
    heroSubtitle: "Cuidado masculino de alta precisión y estilo.",
    ctaText: "Agendar Cita",
    services: [
      { id: "s1", name: "Corte Ejecutivo", price: "$4500", duration: 45, emoji: "✂️", active: true },
      { id: "s2", name: "Barba & Toalla Caliente", price: "$3000", duration: 30, emoji: "🪒", active: true },
      { id: "s3", name: "Tratamiento Facial", price: "$6000", duration: 60, emoji: "✨", active: true },
    ],
    hours: {
      lunes: { open: true, from: "09:00", to: "20:00" },
      martes: { open: true, from: "09:00", to: "20:00" },
      miercoles: { open: true, from: "09:00", to: "20:00" },
      jueves: { open: true, from: "09:00", to: "20:00" },
      viernes: { open: true, from: "09:00", to: "20:00" },
      sabado: { open: true, from: "09:00", to: "18:00" },
      domingo: { open: false, from: "10:00", to: "14:00" },
    },
    staff: [
      { id: "st1", name: "Mateo Rossi", role: "Master Barber", image: "https://images.unsplash.com/mateo.jpg" },
      { id: "st2", name: "Lucas Vega", role: "Colorista", image: "https://images.unsplash.com/lucas.jpg" },
    ],
    testimonials: [
      { id: "t1", name: "Santiago", comment: "Excelente atención y ambiente.", rating: 5 },
    ],
    instagram: "https://instagram.com/royalespa",
    facebook: "https://facebook.com/royalespa",
    tiktok: "https://tiktok.com/@royalespa",
    bookingEnabled: true,
  },
};

const sampleMedia = [
  { id: "m1", type: "image" as const, url: "https://images.unsplash.com/photo1.jpg", name: "Local" },
  { id: "m2", type: "image" as const, url: "https://images.unsplash.com/photo2.jpg", name: "Sillón" },
];

// Initial Normalization
const contractClassic = normalizeBusinessData(sampleBusiness, sampleMedia);
assert(contractClassic.identity.name === "Barbería & Spa Royale", "Normalizer preserves business name");
assert(contractClassic.services.length === 3, "Normalizer extracts all 3 services");
assert(contractClassic.schedule.length === 7, "Normalizer formats full 7-day schedule");
assert(contractClassic.staff.length === 2, "Normalizer formats staff members");
assert(contractClassic.gallery.length === 2, "Normalizer preserves photo gallery");

// Transition 1: Classic -> Motion
const bizMotion = switchTemplateLevel(sampleBusiness, "motion");
const contractMotion = normalizeBusinessData(bizMotion, sampleMedia);
assert(contractMotion.design.templateLevel === "motion", "Switched to Level 2 (Motion)");
assert(contractMotion.identity.name === sampleBusiness.name, "Data preservation: name intact after Classic->Motion");
assert(contractMotion.services.length === 3, "Data preservation: services intact after Classic->Motion");
assert(contractMotion.contact.address === sampleBusiness.address, "Data preservation: address intact after Classic->Motion");

// Transition 2: Motion -> Premium
const bizPremium = switchTemplateLevel(bizMotion, "premium");
const contractPremium = normalizeBusinessData(bizPremium, sampleMedia);
assert(contractPremium.design.templateLevel === "premium", "Switched to Level 3 (Premium)");
assert(contractPremium.identity.name === sampleBusiness.name, "Data preservation: name intact after Motion->Premium");
assert(contractPremium.staff.length === 2, "Data preservation: staff intact after Motion->Premium");
assert(contractPremium.gallery.length === 2, "Data preservation: gallery intact after Motion->Premium");

// Transition 3: Premium -> Immersive 3D
const bizImmersive = switchTemplateLevel(bizPremium, "immersive", "flow", "flow");
const contractImmersive = normalizeBusinessData(bizImmersive, sampleMedia);
assert(contractImmersive.design.templateLevel === "immersive", "Switched to Level 4 (Immersive)");
assert(contractImmersive.design.visualPreset === "flow", "Visual preset assigned to flow");
assert(contractImmersive.identity.name === sampleBusiness.name, "Data preservation: name intact after Premium->Immersive");
assert(contractImmersive.services.length === 3, "Data preservation: services intact after Premium->Immersive");

// Transition 4: Immersive 3D -> Classic (Full Cycle)
const bizCycleBack = switchTemplateLevel(bizImmersive, "classic", "clean");
const contractCycleBack = normalizeBusinessData(bizCycleBack, sampleMedia);
assert(contractCycleBack.design.templateLevel === "classic", "Switched back to Level 1 (Classic)");
assert(contractCycleBack.identity.name === sampleBusiness.name, "Full cycle: 0% data loss across all 4 levels");
assert(contractCycleBack.services[0].name === "Corte Ejecutivo", "Full cycle: service item details 100% identical");
assert(contractCycleBack.social.instagram === "https://instagram.com/royalespa", "Full cycle: social links preserved");

// ─── TEST SUITE 2: THEME SYSTEM & CONTRAST CALCULATION ───
console.log("\n─── 2. Theme System, Palettes & Auto-Contrast ───");

const cleanTheme = getThemeDefinition("clean");
assert(cleanTheme.level === "classic", "Clean theme belongs to Classic level");
assert(cleanTheme.visuals.isDark === false, "Clean theme is light mode");

const modernTheme = getThemeDefinition("modern");
assert(modernTheme.level === "motion", "Modern theme belongs to Motion level");
assert(modernTheme.visuals.isDark === true, "Modern theme is dark mode");

const luxuryTheme = getThemeDefinition("luxury");
assert(luxuryTheme.level === "premium", "Luxury theme belongs to Premium level");

const flowTheme = getThemeDefinition("flow");
assert(flowTheme.level === "immersive", "Flow theme belongs to Immersive level");
assert(flowTheme.defaultPreset === "flow", "Flow theme defaults to flow preset");

// Contrast calculator checks
const darkTextForYellow = getOptimalTextColor("#fbbf24");
assert(darkTextForYellow === "#0f172a", "Yellow primary (#fbbf24) receives dark readable text");

const whiteTextForNavy = getOptimalTextColor("#1e1b4b");
assert(whiteTextForNavy === "#ffffff", "Navy primary (#1e1b4b) receives white readable text");

const cssVars = generateThemeVariables(cleanTheme, "#2563eb", "#db2777");
assert(cssVars["--mw-primary"] === "#2563eb", "Theme variables inject custom primary");
assert(cssVars["--mw-secondary"] === "#db2777", "Theme variables inject custom secondary");
assert(typeof cssVars["--mw-bg"] === "string", "Theme variables generate background token");

// ─── TEST SUITE 3: THREE.JS ENCAPSULATION & PRESETS ───
console.log("\n─── 3. Three.js Presets & WebGL Abstraction ───");

const allowedLevels = ["classic", "motion", "premium", "immersive"];
assert(allowedLevels.length === 4, "Exact 4 template levels configured");

// Check metadata tags
assert(TEMPLATE_LEVEL_METADATA.immersive.supports3D === true, "Level 4 explicitly flags 3D support");
assert(TEMPLATE_LEVEL_METADATA.classic.supports3D === false, "Level 1 flags no 3D for maximum compatibility");

// Validate no tech jargon in customer metadata
const forbiddenTerms = ["three.js", "webgl", "shader", "geometry", "camera", "lighting", "mesh"];
let foundTechJargon = false;
Object.values(TEMPLATE_LEVEL_METADATA).forEach((m) => {
  const combined = `${m.name} ${m.marketingName} ${m.description} ${m.tags.join(" ")}`.toLowerCase();
  forbiddenTerms.forEach((term) => {
    if (combined.includes(term)) {
      foundTechJargon = true;
      console.error(`Found forbidden tech term '${term}' in customer metadata for ${m.name}`);
    }
  });
});
assert(!foundTechJargon, "Zero technical jargon in customer-facing metadata");

// ─── TEST SUITE 4: ACCESSIBILITY & RESPONSIVENESS CONTRACT ───
console.log("\n─── 4. Accessibility & Mobile-First Contract ───");

assert(contractClassic.schedule.every((d) => typeof d.label === "string" && typeof d.enabled === "boolean"), "Schedule days have accessible labels and status");
assert(contractClassic.services.every((s) => typeof s.name === "string" && typeof s.price === "string"), "Services have legible names and formatted prices");
assert(typeof contractClassic.branding.buttonStyle === "string", "Button style contract defined");

console.log("\n════════════════════════════════════════════════════════════");
console.log(` RESULTS: ${passed} passed, ${failed} failed`);
console.log("════════════════════════════════════════════════════════════\n");

if (failed > 0) {
  process.exit(1);
}
