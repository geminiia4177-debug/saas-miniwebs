import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { getTheme } from "@/lib/themes";
import BookingForm from "./BookingForm";

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params;
  const biz = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: subdomain },
        { customDomain: subdomain }
      ]
    },
  });

  if (!biz) return {};

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
const ModernTheme = dynamic(() => import("@/components/landings/themes/ModernTheme"));
const DarkEleganceTheme = dynamic(() => import("@/components/landings/themes/DarkEleganceTheme"));
const ListTheme = dynamic(() => import("@/components/landings/themes/ListTheme"));
const ChatbotWidget = dynamic(() => import("@/components/landings/ChatbotWidget"));

// Como es Next.js 15, los params son asíncronos
export default async function PublicLandingPage({ params, searchParams }: { params: Promise<{ subdomain: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { subdomain } = await params;

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

  if (!rawBiz) {
    return notFound();
  }

  const activeConfig = (rawBiz as any).publishedConfig || (rawBiz as any).layoutConfig || {};

  // SEC-033 Fix: Create a strict PublicBusinessDTO to avoid data leakage
  const biz = {
    id: rawBiz.id,
    name: rawBiz.name,
    type: rawBiz.type,
    description: rawBiz.description,
    address: activeConfig.address || "",
    phone: rawBiz.phone,
    logoUrl: rawBiz.logoUrl,
    primaryColor: rawBiz.primaryColor,
    employees: rawBiz.employees,
    layoutConfig: {
       sections: activeConfig.sections || [],
       media: activeConfig.media || [],
       themeVariant: activeConfig.themeVariant || "classic",
       chatbotEnabled: activeConfig.chatbotEnabled,
       chatbotName: activeConfig.chatbotName,
       barberiaServices: activeConfig.barberiaServices,
       clinicaServices: activeConfig.clinicaServices,
       tallerServices: activeConfig.tallerServices,
       canchaTarifas: activeConfig.canchaTarifas,
       menuCategorias: activeConfig.menuCategorias,
       hours: activeConfig.hours,
    },
    instagram: activeConfig.instagram || "",
    facebook: activeConfig.facebook || "",
    whatsapp: activeConfig.whatsapp || "",
    tiktok: activeConfig.tiktok || "",
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
    const themeVariant = layoutConfig.themeVariant || "classic";
    
    // Si se eligió un tema premium (no clásico), cargamos la vista universal adaptada
    if (themeVariant === "modern") return <ModernTheme negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    if (themeVariant === "dark") return <DarkEleganceTheme negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    if (themeVariant === "list") return <ListTheme negocio={biz} media={media} businessId={biz.id} sections={sections} />;
    
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

  // SEC-031 Fix: Sanitize primaryColor to prevent CSS injection
  const safeColor = (color: string | null | undefined) => {
    if (!color) return null;
    return /^[a-zA-Z0-9#\-\(\)\.,% ]+$/.test(color) ? color : null;
  };
  
  const accentColor = safeColor(biz.primaryColor) || theme.accent;

  // Generamos el bloque de CSS dinámico para este negocio
  const themeStyles = `
    :root {
      --biz-bg: ${theme.bg};
      --biz-surface: ${theme.surface};
      --biz-accent: ${accentColor};
      --biz-text: ${theme.textPrimary};
      --biz-text-sec: ${theme.textSecondary};
      --biz-border: ${theme.border};
    }
    body {
      background-color: var(--biz-bg);
      color: var(--biz-text);
    }
  `;

  const sp = await searchParams;
  const editMode = sp.preview === 'true';
  const EditModeWrapper = editMode ? dynamic(() => import("@/components/landings/EditModeWrapper")) : null;

  if (TemplateComponent) {
    return (
      <div className={`${theme.fontDisplay}`}>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
      <DefaultTemplate negocio={biz} media={media} sections={sections} />
      {layoutConfig.chatbotEnabled !== false && (
        <ChatbotWidget businessId={biz.id} bizName={biz.name} primaryColor={accentColor} chatbotName={layoutConfig.chatbotName || "Asistente Virtual"} />
      )}
      {EditModeWrapper && <EditModeWrapper />}
    </div>
  );
}