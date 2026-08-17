import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { getTheme } from "@/lib/themes";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BookingForm from "./BookingForm";

export const revalidate = 0; // Disable aggressive caching for public lands

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params;
  const biz = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: subdomain },
        { customDomain: subdomain }
      ]
    },
    select: {
      name: true,
      description: true,
      type: true,
      logoUrl: true,
      customDomain: true,
      status: true,
    }
  });

  // P0-004: Do not generate metadata for blocked or archived businesses
  if (!biz || biz.status === "BLOCKED" || biz.status === "ARCHIVED") return {};

  const defaultImage = "https://saas-miniwebs.com/default-logo.jpg";
  const imageUrl = biz.logoUrl || defaultImage;
  const domainUrl = biz.customDomain ? `https://${biz.customDomain}` : `https://${subdomain}.saas-miniwebs.com`;

  return {
    title: `${biz.name} | Reserva tu turno`,
    description: biz.description || `Bienvenido a ${biz.name}. Reserva tu turno online de forma rápida y sencilla.`,
    keywords: [biz.name, biz.type || "negocio", "turnos", "reservas", "online"],
    robots: "index, follow",
    openGraph: {
      title: `${biz.name} | Reserva tu turno`,
      description: biz.description || `Reserva tu turno en ${biz.name} en pocos segundos.`,
      url: domainUrl,
      siteName: biz.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Logo de ${biz.name}`,
        }
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: biz.name,
      description: biz.description || `Reserva online en ${biz.name}.`,
      images: [imageUrl],
    },
  };
}

import dynamic from "next/dynamic";

// 1. IMPORTAMOS TUS NUEVAS PLANTILLAS PREMIUM (Lazy loaded)
const BarberiaTemplate = dynamic(() => import("@/components/landings/BarberiaTemplate"));
const CanchaTemplate = dynamic(() => import("@/components/landings/CanchaTemplate"));
const MenuTemplate = dynamic(() => import("@/components/landings/MenuTemplate"));
const ClinicaTemplate = dynamic(() => import("@/components/landings/ClinicaTemplate"));
const EsteticaTemplate = dynamic(() => import("@/components/landings/EsteticaTemplate"));
const GimnasioTemplate = dynamic(() => import("@/components/landings/GimnasioTemplate"));

const TallerTemplate = dynamic(() => import("@/components/landings/TallerTemplate"));
const LavaderoTemplate = dynamic(() => import("@/components/landings/LavaderoTemplate"));
const GeneralTemplate = dynamic(() => import("@/components/landings/GeneralTemplate"));
const DefaultTemplate = dynamic(() => import("@/components/landings/DefaultTemplate"));

// NUEVOS TEMAS UNIVERSALES
const TemplateRenderer = dynamic(() => import("@/components/landings/templates/TemplateRenderer"));
const ModernTheme = dynamic(() => import("@/components/landings/themes/ModernTheme"));
const DarkEleganceTheme = dynamic(() => import("@/components/landings/themes/DarkEleganceTheme"));
const ListTheme = dynamic(() => import("@/components/landings/themes/ListTheme"));
const ChatbotWidget = dynamic(() => import("@/components/landings/ChatbotWidget"));

// Como es Next.js 15, los params son asíncronos
export default async function PublicLandingPage({ params, searchParams }: { params: Promise<{ subdomain: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { subdomain } = await params;
  const sp = await searchParams;

  // 1. Buscamos el negocio en la base de datos (por subdominio o por dominio personalizado)
  const rawBiz = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: subdomain },
        { customDomain: subdomain }
      ]
    },
    include: {
      employees: {
        where: { isPublic: true }
      }
    }
  });

  // P0-004: BLOCKED and ARCHIVED businesses must never render public landing
  if (!rawBiz || rawBiz.status === "BLOCKED" || rawBiz.status === "ARCHIVED") {
    return notFound();
  }

  // P0-001: Preview authorization check (requires authenticated owner/admin session). Anonymous preview is DENIED.
  let isPreviewAuthorized = false;
  if (sp.preview === "true") {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.id !== rawBiz.userId)) {
      return notFound();
    }
    isPreviewAuthorized = true;
  }

  // P0-001: Public visitors ONLY see publishedConfig. If null, fallback to defaultPublicConfig. NEVER fallback to draft layoutConfig.
  const defaultPublicConfig = {
    sections: [
      { id: "hero", label: "Hero / Portada", icon: "image", visible: true, config: { title: `Bienvenido a ${rawBiz.name}`, subtitle: "Tu negocio", ctaText: "Reservar Turno" } },
      { id: "services", label: "Servicios", icon: "star", visible: true, config: { items: [] } },
    ],
    themeVariant: "classic"
  };

  const activeConfig = isPreviewAuthorized
    ? ((rawBiz.layoutConfig as any) || (rawBiz.publishedConfig as any) || defaultPublicConfig)
    : ((rawBiz.publishedConfig as any) || defaultPublicConfig);

  // SEC-033 / P1-012 Fix: Create a strict PublicBusinessDTO to avoid data leakage
  const safeLayoutConfig = {
    sections: Array.isArray(activeConfig.sections) ? activeConfig.sections : [],
    media: Array.isArray(activeConfig.media) ? activeConfig.media : [],
    templateLevel: typeof activeConfig.templateLevel === "string" ? activeConfig.templateLevel : undefined,
    themeVariant: typeof activeConfig.themeVariant === "string" ? activeConfig.themeVariant : "classic",
    themeId: typeof activeConfig.themeId === "string" ? activeConfig.themeId : undefined,
    visualPreset: typeof activeConfig.visualPreset === "string" ? activeConfig.visualPreset : undefined,
    animationIntensity: typeof activeConfig.animationIntensity === "string" ? activeConfig.animationIntensity : undefined,
    chatbotEnabled: activeConfig.chatbotEnabled !== false,
    chatbotName: typeof activeConfig.chatbotName === "string" ? activeConfig.chatbotName : "Asistente Virtual",
    services: Array.isArray(activeConfig.services) ? activeConfig.services : undefined,
    barberiaServices: Array.isArray(activeConfig.barberiaServices) ? activeConfig.barberiaServices : undefined,
    clinicaServices: Array.isArray(activeConfig.clinicaServices) ? activeConfig.clinicaServices : undefined,
    tallerServices: Array.isArray(activeConfig.tallerServices) ? activeConfig.tallerServices : undefined,
    canchaTarifas: Array.isArray(activeConfig.canchaTarifas) ? activeConfig.canchaTarifas : undefined,
    menuCategorias: Array.isArray(activeConfig.menuCategorias) ? activeConfig.menuCategorias : undefined,
    hours: typeof activeConfig.hours === "object" && activeConfig.hours !== null ? activeConfig.hours : undefined,
    buttonStyle: typeof activeConfig.buttonStyle === "string" ? activeConfig.buttonStyle : undefined,
    backgroundType: typeof activeConfig.backgroundType === "string" ? activeConfig.backgroundType : undefined,
    backgroundImageUrl: typeof activeConfig.backgroundImageUrl === "string" ? activeConfig.backgroundImageUrl : undefined,
  };

  const biz = {
    id: rawBiz.id,
    name: rawBiz.name,
    type: rawBiz.type,
    description: rawBiz.description,
    address: typeof activeConfig.address === "string" ? activeConfig.address : "",
    phone: rawBiz.phone,
    logoUrl: rawBiz.logoUrl,
    bannerUrl: rawBiz.bannerUrl,
    buttonStyle: safeLayoutConfig.buttonStyle,
    backgroundType: safeLayoutConfig.backgroundType,
    backgroundImageUrl: safeLayoutConfig.backgroundImageUrl,
    primaryColor: rawBiz.primaryColor,
    secondaryColor: rawBiz.secondaryColor,
    accentColor: rawBiz.accentColor,
    fontFamily: rawBiz.fontFamily,
    employees: rawBiz.employees,
    layoutConfig: safeLayoutConfig,
    instagram: typeof activeConfig.instagram === "string" ? activeConfig.instagram : "",
    facebook: typeof activeConfig.facebook === "string" ? activeConfig.facebook : "",
    whatsapp: typeof activeConfig.whatsapp === "string" ? activeConfig.whatsapp : "",
    tiktok: typeof activeConfig.tiktok === "string" ? activeConfig.tiktok : "",
  };

  // ─────────────────────────────────────────────────────────
  // 2. EL "PEAJE" DE PLANTILLAS (Ruteo Dinámico)
  // Si el negocio tiene un tipo específico, lo mandamos a su diseño premium
  // ─────────────────────────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": biz.type === "barberia" ? "HairSalon" : biz.type === "menu" ? "Restaurant" : biz.type === "clinica" ? "MedicalClinic" : biz.type === "estetica" ? "BeautySalon" : biz.type === "gimnasio" ? "ExerciseGym" : biz.type === "taller" ? "AutoRepair" : biz.type === "lavadero" ? "AutoWash" : "LocalBusiness",
    "name": biz.name,
    "image": biz.logoUrl || "https://saas-miniwebs.com/default-logo.jpg",
    "url": `https://${subdomain}.saas-miniwebs.com`,
    "telephone": biz.whatsapp || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": biz.address || ""
    }
  };

  const renderTemplate = () => {
    const layoutConfig = biz.layoutConfig || {};
    const media = layoutConfig.media || [];
    const sections = layoutConfig.sections || [];
    const templateLevel = layoutConfig.templateLevel;
    const themeVariant = layoutConfig.themeVariant || "classic";
    
    // Si se eligió una plantilla multinivel o tema universal, usamos TemplateRenderer
    const isMultiLevel =
      !!templateLevel ||
      [
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
      ].includes(themeVariant);

    if (isMultiLevel) {
      return (
        <TemplateRenderer
          negocio={biz}
          media={media}
          sections={sections}
          bookingElement={
            <BookingForm
              businessId={biz.id}
              services={((layoutConfig.services || layoutConfig.barberiaServices || [{ name: "Servicio General" }]) as any[]).map((s: any) => typeof s === "string" ? s : s.name)}
              primaryColor={biz.primaryColor || undefined}
              secondaryColor={biz.secondaryColor || undefined}
            />
          }
        />
      );
    }
    
    // Diseño clásico según el tipo de negocio
    if (biz.type === "barberia") return <BarberiaTemplate negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "taller") return <TallerTemplate negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "lavadero") return <LavaderoTemplate negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "general") return <GeneralTemplate negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    
    if (biz.type === "cancha") return <CanchaTemplate negocio={biz} businessId={biz.id} />;
    if (biz.type === "menu") return <MenuTemplate negocio={biz} businessId={biz.id} />;
    if (biz.type === "clinica") return <ClinicaTemplate negocio={biz} businessId={biz.id} />;
    if (biz.type === "estetica") return <EsteticaTemplate negocio={biz} businessId={biz.id} />;
    if (biz.type === "gimnasio") return <GimnasioTemplate negocio={biz} businessId={biz.id} />;
    return null;
  };

  const TemplateComponent = renderTemplate();
  const theme = getTheme(biz.type);

  // SEC-031 / P1-006 Fix: Strict hex / rgb color sanitizer to prevent CSS injection
  const safeColor = (color: string | null | undefined) => {
    if (!color) return null;
    return /^#([0-9a-fA-F]{3,8})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^hsl\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)$/.test(color.trim()) ? color.trim() : null;
  };
  
  const customAccent = safeColor(biz.accentColor);
  const customPrimary = safeColor(biz.primaryColor);
  const customSecondary = safeColor(biz.secondaryColor);

  const accentColor = customAccent || customPrimary || theme.accent;
  const primaryColor = customPrimary || theme.accent;
  const secondaryColor = customSecondary || theme.border;

  // Generamos el bloque de CSS dinámico para este negocio
  const themeStyles = `
    :root {
      --biz-bg: ${theme.bg};
      --biz-surface: ${theme.surface};
      --biz-accent: ${accentColor};
      --biz-primary: ${primaryColor};
      --biz-secondary: ${secondaryColor};
      --biz-text: ${theme.textPrimary};
      --biz-text-sec: ${theme.textSecondary};
      --biz-border: ${theme.border};
      --accent: ${accentColor};
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
    }
    body {
      background-color: var(--biz-bg);
      color: var(--biz-text);
    }
  `;

  const editMode = sp.preview === 'true';
  const EditModeWrapper = editMode ? dynamic(() => import("@/components/landings/EditModeWrapper")) : null;

  if (TemplateComponent) {
    return (
      <div className={`${theme.fontDisplay}`}>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        {TemplateComponent}
        {biz.layoutConfig?.chatbotEnabled !== false && (
          <ChatbotWidget businessId={biz.id} bizName={biz.name} primaryColor={accentColor} chatbotName={biz.layoutConfig?.chatbotName || "Asistente Virtual"} />
        )}
        {EditModeWrapper && <EditModeWrapper />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 3. DISEÑO GENÉRICO (Plan B)
  // Si no es ninguno de los de arriba, usa el constructor por defecto
  // ─────────────────────────────────────────────────────────
  const layoutConfig = biz.layoutConfig || {};
  const sections = layoutConfig.sections || [];
  const media = layoutConfig.media || [];
  
  return (
    <div className={`${theme.fontDisplay}`}>
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <DefaultTemplate negocio={biz} media={media} sections={sections} />
      {layoutConfig.chatbotEnabled !== false && (
        <ChatbotWidget businessId={biz.id} bizName={biz.name} primaryColor={accentColor} chatbotName={layoutConfig.chatbotName || "Asistente Virtual"} />
      )}
      {EditModeWrapper && <EditModeWrapper />}
    </div>
  );
}