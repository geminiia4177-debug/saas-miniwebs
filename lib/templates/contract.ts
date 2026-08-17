import { Biz, MediaItem, Section, ServiceItem, BusinessHours } from "@/lib/types";

/**
 * MINIWEBS MULTI-LEVEL VISUAL TEMPLATE SYSTEM
 * SHARED DATA CONTRACT & NORMALIZER
 * 
 * Guarantees that all template levels (Classic, Modern Motion, Premium, Immersive 3D)
 * consume the exact same normalized business data model.
 */

export type TemplateLevel = "classic" | "motion" | "premium" | "immersive";
export type AnimationIntensity = "subtle" | "balanced" | "dynamic";
export type ThreePresetId = "flow" | "particles" | "luxury" | "organic";

export interface BusinessIdentity {
  name: string;
  logo: string;
  description: string;
  tagline: string;
}

export interface BusinessContact {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  location: string;
  mapUrl?: string;
}

export interface BusinessBranding {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: string;
  buttonStyle: "rounded" | "square" | "pill";
}

export interface BusinessHero {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaSecondary?: string;
  badge?: string;
  titleColor?: string;
  bannerOpacity?: number;
}

export interface NormalizedService {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; // in minutes
  image: string;
  emoji?: string;
  category?: string;
  active: boolean;
}

export interface NormalizedGalleryItem {
  id: string;
  image: string;
  title: string;
  description?: string;
}

export interface NormalizedScheduleDay {
  day: string;
  label: string;
  open: string;
  close: string;
  enabled: boolean;
}

export interface NormalizedStaffMember {
  id: string;
  name: string;
  role: string;
  image: string;
  description: string;
}

export interface NormalizedTestimonial {
  id: string;
  name: string;
  comment: string;
  role?: string;
  rating: number;
  image?: string;
}

export interface BusinessSocial {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface BusinessBookingConfig {
  enabled: boolean;
  whatsapp: string;
  bookingUrl: string;
  slotDuration: number;
  title?: string;
  subtitle?: string;
}

export interface BusinessDesignConfig {
  templateLevel: TemplateLevel;
  themeId: string;
  animationIntensity: AnimationIntensity;
  visualPreset: ThreePresetId;
  visualIntensity: number; // 0.1 to 1.0
  subdomain: string;
  customDomain?: string;
  businessId: string;
  type: string;
}

export interface BusinessDataContract {
  identity: BusinessIdentity;
  contact: BusinessContact;
  branding: BusinessBranding;
  hero: BusinessHero;
  services: NormalizedService[];
  gallery: NormalizedGalleryItem[];
  schedule: NormalizedScheduleDay[];
  staff: NormalizedStaffMember[];
  testimonials: NormalizedTestimonial[];
  social: BusinessSocial;
  booking: BusinessBookingConfig;
  design: BusinessDesignConfig;
  rawSections?: Section[];
}

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

/**
 * Normalizes any database business object, media array, and sections array
 * into the standardized BusinessDataContract.
 */
export function normalizeBusinessData(
  biz: any,
  media: MediaItem[] = [],
  sections: Section[] = []
): BusinessDataContract {
  const config = biz?.layoutConfig || {};

  // 1. Identity
  const name = biz?.name || "Mi Negocio";
  const logo = biz?.logoUrl || config.logoUrl || "";
  const description = biz?.description || config.description || "Tu experiencia premium";
  const tagline = config.tagline || config.heroSubtitle || "Calidad, dedicación y excelencia en cada detalle";

  // 2. Contact
  const phone = biz?.phone || config.phone || "";
  const whatsapp = biz?.whatsapp || config.whatsapp || phone || "";
  const email = biz?.email || config.email || "";
  const address = biz?.address || config.address || "";
  const location = config.location || address || "";
  const mapUrl = config.mapUrl || "";

  // 3. Branding & Colors
  const primaryColor = biz?.primaryColor || config.primaryColor || biz?.accentColor || "#3b82f6";
  const secondaryColor = biz?.secondaryColor || config.secondaryColor || "#db2777";
  const backgroundColor = biz?.backgroundColor || config.backgroundColor || "#0f172a";
  const textColor = biz?.textColor || config.textColor || "#f8fafc";
  const font = biz?.fontFamily || config.fontFamily || "'Inter', sans-serif";
  const buttonStyle = (biz?.buttonStyle || config.buttonStyle || "rounded") as "rounded" | "square" | "pill";

  // 4. Hero
  const heroSection = sections.find((s) => s.id === "hero");
  const heroTitle = config.heroTitle || heroSection?.config?.title || name;
  const heroSubtitle = config.heroSubtitle || heroSection?.config?.subtitle || description;
  const heroImage = biz?.bannerUrl || config.bannerUrl || heroSection?.config?.imageUrl || "";
  const ctaText = config.ctaText || heroSection?.config?.ctaText || "Reservar Turno";
  const ctaSecondary = config.ctaSecondary || heroSection?.config?.ctaSecondary || "Ver Servicios";
  const badge = config.heroBadge || "Experiencia Premium";

  // 5. Services extraction across all business types
  let extractedServices: NormalizedService[] = [];
  
  if (Array.isArray(config.services) && config.services.length > 0) {
    extractedServices = config.services.map(mapService);
  } else if (Array.isArray(config.barberiaServices) && config.barberiaServices.length > 0) {
    extractedServices = config.barberiaServices.map(mapService);
  } else if (Array.isArray(config.esteticaServicios) && config.esteticaServicios.length > 0) {
    extractedServices = config.esteticaServicios.map(mapService);
  } else if (Array.isArray(config.clinicaEspecialidades) && config.clinicaEspecialidades.length > 0) {
    extractedServices = config.clinicaEspecialidades.map(mapService);
  } else if (Array.isArray(config.tallerServices) && config.tallerServices.length > 0) {
    extractedServices = config.tallerServices.map(mapService);
  } else if (Array.isArray(config.items) && config.items.length > 0) {
    extractedServices = config.items.map(mapService);
  } else {
    // Check in sections
    const servicesSection = sections.find((s) => s.id === "services");
    if (servicesSection?.config?.items && Array.isArray(servicesSection.config.items)) {
      extractedServices = servicesSection.config.items.map(mapService);
    }
  }

  if (extractedServices.length === 0) {
    // Clean default fallback services
    extractedServices = [
      {
        id: "srv-1",
        name: "Servicio Premium",
        description: "Atención especializada con los más altos estándares de calidad.",
        price: "$3.500",
        duration: 45,
        image: "",
        emoji: "⭐",
        active: true,
      },
      {
        id: "srv-2",
        name: "Servicio Express",
        description: "Rapidez y eficacia pensadas para tu comodidad.",
        price: "$2.500",
        duration: 30,
        image: "",
        emoji: "⚡",
        active: true,
      },
      {
        id: "srv-3",
        name: "Experiencia VIP",
        description: "Tratamiento completo integral con asesoramiento personalizado.",
        price: "$6.000",
        duration: 60,
        image: "",
        emoji: "✨",
        active: true,
      },
    ];
  }

  // 6. Gallery
  const galleryItems: NormalizedGalleryItem[] = media
    .filter((m) => m && m.type === "image" && m.url)
    .map((m, idx) => ({
      id: m.id || `gal-${idx}`,
      image: m.url,
      title: m.name || `Galería ${idx + 1}`,
      description: "",
    }));

  // 7. Schedule
  const hours: BusinessHours = config.hours || biz?.hours || {
    lunes: { open: true, from: "09:00", to: "19:00" },
    martes: { open: true, from: "09:00", to: "19:00" },
    miercoles: { open: true, from: "09:00", to: "19:00" },
    jueves: { open: true, from: "09:00", to: "19:00" },
    viernes: { open: true, from: "09:00", to: "19:00" },
    sabado: { open: true, from: "09:00", to: "14:00" },
    domingo: { open: false, from: "10:00", to: "14:00" },
  };

  const scheduleDays: NormalizedScheduleDay[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map((d) => {
    const info = hours[d] || { open: false, from: "09:00", to: "18:00" };
    return {
      day: d,
      label: DAY_LABELS[d] || d,
      open: info.from || "09:00",
      close: info.to || "18:00",
      enabled: !!info.open,
    };
  });

  // 8. Staff / Profesionales
  const staff: NormalizedStaffMember[] = (config.staff || config.profesionales || [
    {
      id: "staff-1",
      name: "Especialista Principal",
      role: "Dirección & Estilo",
      image: "",
      description: "Más de 10 años de experiencia transformando la imagen de nuestros clientes.",
    }
  ]).map((s: any, idx: number) => ({
    id: s.id || `staff-${idx}`,
    name: s.name || s.nombre || `Profesional ${idx + 1}`,
    role: s.role || s.especialidad || s.cargo || "Especialista",
    image: s.image || s.imageUrl || s.foto || "",
    description: s.description || s.bio || "",
  }));

  // 9. Testimonials
  const testimonials: NormalizedTestimonial[] = (config.testimonials || [
    {
      id: "test-1",
      name: "Camila Rossi",
      role: "Cliente Frecuente",
      comment: "Excelente atención y resultados increíbles. Súper recomendado.",
      rating: 5,
    },
    {
      id: "test-2",
      name: "Martín Benítez",
      role: "Cliente Verificado",
      comment: "Puntuales, modernos y muy profesionales. La mejor experiencia.",
      rating: 5,
    }
  ]).map((t: any, idx: number) => ({
    id: t.id || `test-${idx}`,
    name: t.name || t.nombre || "Cliente",
    comment: t.comment || t.texto || "Excelente servicio",
    role: t.role || "Cliente",
    rating: typeof t.rating === "number" ? t.rating : 5,
    image: t.image || t.avatar || "",
  }));

  // 10. Social
  const social: BusinessSocial = {
    instagram: config.instagram || biz?.instagram || "",
    facebook: config.facebook || biz?.facebook || "",
    tiktok: config.tiktok || biz?.tiktok || "",
    youtube: config.youtube || biz?.youtube || "",
    whatsapp: whatsapp,
  };

  // 11. Booking
  const booking: BusinessBookingConfig = {
    enabled: config.bookingEnabled !== false,
    whatsapp: whatsapp,
    bookingUrl: config.bookingUrl || biz?.bookingUrl || "",
    slotDuration: config.slotDuration || 30,
    title: config.bookingTitle || "Reservá tu turno",
    subtitle: config.bookingSubtitle || "Seleccioná día y horario en segundos",
  };

  // 12. Design / Level / Theme mapping
  const rawTheme = config.themeVariant || config.theme || "classic";
  let templateLevel: TemplateLevel = "classic";
  let themeId = "clean";

  if (rawTheme === "modern" || rawTheme === "motion" || rawTheme === "dynamic") {
    templateLevel = "motion";
    themeId = rawTheme === "dynamic" ? "dynamic" : "modern";
  } else if (rawTheme === "dark" || rawTheme === "premium" || rawTheme === "luxury" || rawTheme === "editorial" || rawTheme === "minimal_luxury") {
    templateLevel = "premium";
    themeId = rawTheme === "editorial" ? "editorial" : (rawTheme === "minimal_luxury" ? "minimal_luxury" : "luxury");
  } else if (rawTheme === "immersive" || rawTheme === "flow" || rawTheme === "particles" || rawTheme === "organic" || rawTheme === "immersive_dark") {
    templateLevel = "immersive";
    themeId = rawTheme === "particles" ? "particles" : (rawTheme === "organic" ? "organic" : (rawTheme === "immersive_dark" ? "immersive_dark" : "flow"));
  } else if (rawTheme === "essential") {
    templateLevel = "classic";
    themeId = "essential";
  } else {
    templateLevel = (config.templateLevel as TemplateLevel) || "classic";
    themeId = config.themeId || "clean";
  }

  const animationIntensity: AnimationIntensity = config.animationIntensity || "balanced";
  const visualPreset: ThreePresetId = (config.visualPreset || (themeId === "particles" ? "particles" : (themeId === "luxury" ? "luxury" : (themeId === "organic" ? "organic" : "flow")))) as ThreePresetId;
  const visualIntensity = typeof config.visualIntensity === "number" ? config.visualIntensity : 0.8;

  return {
    identity: { name, logo, description, tagline },
    contact: { phone, whatsapp, email, address, location, mapUrl },
    branding: { primaryColor, secondaryColor, backgroundColor, textColor, font, buttonStyle },
    hero: {
      title: heroTitle,
      subtitle: heroSubtitle,
      image: heroImage,
      ctaText,
      ctaSecondary,
      badge,
      titleColor: config.heroTitleColor || "#ffffff",
      bannerOpacity: typeof config.bannerOpacity === "number" ? config.bannerOpacity : 70,
    },
    services: extractedServices,
    gallery: galleryItems,
    schedule: scheduleDays,
    staff,
    testimonials,
    social,
    booking,
    design: {
      templateLevel,
      themeId,
      animationIntensity,
      visualPreset,
      visualIntensity,
      subdomain: biz?.subdomain || "demo",
      customDomain: biz?.customDomain || undefined,
      businessId: biz?.id || "preview-id",
      type: biz?.type || "general",
    },
    rawSections: sections,
  };
}

function mapService(item: any, idx: number): NormalizedService {
  return {
    id: item.id || `srv-${idx}`,
    name: item.name || item.nombre || `Servicio ${idx + 1}`,
    description: item.description || item.descripcion || "",
    price: typeof item.price === "number" ? `$${item.price}` : (item.price || item.precio || "$0"),
    duration: typeof item.duration === "number" ? item.duration : (parseInt(item.duracion, 10) || 30),
    image: item.imageUrl || item.image || item.imagen || "",
    emoji: item.emoji || "✨",
    category: item.category || item.categoria || "",
    active: item.active !== false,
  };
}

/**
 * Switching function: modifies only the visual configuration layer (level, theme, presets)
 * and leaves ALL business data untouched.
 */
export function switchTemplateLevel(
  biz: any,
  targetLevel: TemplateLevel,
  targetTheme?: string,
  targetPreset?: ThreePresetId
): any {
  if (!biz) return biz;

  const currentLayout = biz.layoutConfig || {};

  let resolvedTheme = targetTheme;
  if (!resolvedTheme) {
    if (targetLevel === "classic") resolvedTheme = "clean";
    else if (targetLevel === "motion") resolvedTheme = "modern";
    else if (targetLevel === "premium") resolvedTheme = "luxury";
    else if (targetLevel === "immersive") resolvedTheme = "flow";
    else resolvedTheme = "clean";
  }

  let resolvedPreset = targetPreset;
  if (!resolvedPreset && targetLevel === "immersive") {
    if (resolvedTheme === "particles") resolvedPreset = "particles";
    else if (resolvedTheme === "luxury") resolvedPreset = "luxury";
    else if (resolvedTheme === "organic") resolvedPreset = "organic";
    else resolvedPreset = "flow";
  }

  return {
    ...biz,
    layoutConfig: {
      ...currentLayout,
      templateLevel: targetLevel,
      themeVariant: resolvedTheme,
      themeId: resolvedTheme,
      ...(resolvedPreset ? { visualPreset: resolvedPreset } : {}),
    },
  };
}
