import React from "react";

interface JsonLdSchemaProps {
  negocio: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    layoutConfig?: any;
    employees?: Array<{ id: string; name: string; role?: string | null }> | null;
  };
  url?: string;
}

const DEFAULT_LOGO = "https://saas-miniwebs.com/default-logo.jpg";

const DAY_MAP: Record<string, string> = {
  lunes: "Monday",
  martes: "Tuesday",
  miercoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sabado: "Saturday",
  domingo: "Sunday",
};

export default function JsonLdSchema({ negocio, url }: JsonLdSchemaProps) {
  if (!negocio || !negocio.name) return null;

  const type = negocio.type?.toLowerCase() || "general";
  const cfg = negocio.layoutConfig || {};
  const currentUrl = url || "https://saas-miniwebs.com";
  const logo = negocio.logoUrl || DEFAULT_LOGO;

  // Social URLs (sameAs)
  const sameAs: string[] = [];
  if (negocio.instagram) {
    const handle = negocio.instagram.replace(/^@/, "");
    sameAs.push(`https://instagram.com/${handle}`);
  }
  if (negocio.facebook) {
    sameAs.push(negocio.facebook.startsWith("http") ? negocio.facebook : `https://facebook.com/${negocio.facebook}`);
  }
  if (negocio.tiktok) {
    const handle = negocio.tiktok.replace(/^@/, "");
    sameAs.push(`https://tiktok.com/@${handle}`);
  }
  if (negocio.whatsapp) {
    const digits = negocio.whatsapp.replace(/\D/g, "");
    if (digits) sameAs.push(`https://wa.me/${digits}`);
  }

  // Opening hours specification
  const openingHoursSpecification: any[] = [];
  if (cfg.hours && typeof cfg.hours === "object") {
    Object.entries(cfg.hours).forEach(([dia, val]: [string, any]) => {
      const dayOfWeek = DAY_MAP[dia.toLowerCase()];
      if (dayOfWeek && val && val.open !== false && val.from && val.to) {
        openingHoursSpecification.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${dayOfWeek}`,
          opens: val.from,
          closes: val.to,
        });
      }
    });
  }

  // Schema Type mapping
  let schemaType = "LocalBusiness";
  if (type === "menu" || type === "trompo" || type === "cantina_gourmet" || type === "gastrobar") schemaType = "Restaurant";
  else if (type === "barberia" || type === "el_patron" || type === "urban_fade" || type === "fade_studio") schemaType = "HairSalon";
  else if (type === "estetica" || type === "unas" || type === "lashista" || type === "glitz_lash" || type === "glam_lash") schemaType = "BeautySalon";
  else if (type === "clinica" || type === "dental" || type === "dentista" || type === "holistic_spa" || type === "dental_spa") schemaType = "MedicalClinic";
  else if (type === "veterinaria" || type === "mascotas" || type === "pet_resort" || type === "hotel_canino") schemaType = "VeterinaryCare";
  else if (type === "gimnasio") schemaType = "ExerciseGym";
  else if (type === "taller") schemaType = "AutoRepair";
  else if (type === "lavadero") schemaType = "AutoWash";
  else if (type === "cancha") schemaType = "SportsActivityLocation";
  else if (type === "tienda") schemaType = "Store";

  // Base Schema
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: negocio.name,
    description: negocio.description || `${negocio.name} — Servicios y atención personalizada online`,
    url: currentUrl,
    image: logo,
    telephone: negocio.phone || negocio.whatsapp || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    priceRange: "$$",
  };

  if (negocio.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: negocio.address,
      addressCountry: "AR",
    };
  }

  if (openingHoursSpecification.length > 0) {
    schema.openingHoursSpecification = openingHoursSpecification;
  }

  // Employees / Staff
  if (Array.isArray(negocio.employees) && negocio.employees.length > 0) {
    schema.employee = negocio.employees.map((emp) => ({
      "@type": "Person",
      name: emp.name,
      jobTitle: emp.role || "Profesional",
    }));
  }

  // Niche-specific structured data additions
  switch (type) {
    case "menu": {
      schema.servesCuisine = "Comida y Bebidas";
      const categories = Array.isArray(cfg.menuCategorias) ? cfg.menuCategorias : [];
      if (categories.length > 0) {
        schema.hasMenu = {
          "@type": "Menu",
          name: `Menú de ${negocio.name}`,
          url: currentUrl,
          hasMenuSection: categories.slice(0, 10).map((cat: any) => ({
            "@type": "MenuSection",
            name: cat.name || cat.nombre || "Categoría",
            hasMenuItem: Array.isArray(cat.products)
              ? cat.products.slice(0, 8).map((prod: any) => ({
                  "@type": "MenuItem",
                  name: prod.nombre || prod.name,
                  description: prod.descripcion || prod.description || undefined,
                  offers: {
                    "@type": "Offer",
                    price: prod.precio || prod.price || 0,
                    priceCurrency: "ARS",
                    availability: prod.disponible !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  },
                }))
              : [],
          })),
        };
      }
      break;
    }

    case "tienda": {
      const products = Array.isArray(cfg.tiendaProductos) ? cfg.tiendaProductos : [];
      if (products.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: `Catálogo de ${negocio.name}`,
          itemListElement: products.slice(0, 15).map((prod: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: prod.nombre || prod.name,
              description: prod.descripcion || prod.description || undefined,
              image: prod.imagen || prod.imageUrl || undefined,
            },
            price: prod.precio || prod.price || 0,
            priceCurrency: "ARS",
            availability: prod.disponible !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          })),
        };
      }
      break;
    }

    case "barberia": {
      const services = Array.isArray(cfg.barberiaServices)
        ? cfg.barberiaServices
        : Array.isArray(cfg.services)
        ? cfg.services
        : [];
      if (services.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Servicios de Barbería y Cuidado Masculino",
          itemListElement: services.slice(0, 12).map((srv: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: srv.title || srv.name || "Corte de Cabello",
              description: srv.desc || srv.description || undefined,
            },
            price: typeof srv.price === "number" ? srv.price : parseFloat(String(srv.price || "0").replace(/[^0-9.]/g, "")) || 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    case "estetica": {
      const services = Array.isArray(cfg.esteticaServices)
        ? cfg.esteticaServices
        : Array.isArray(cfg.servicios)
        ? cfg.servicios
        : Array.isArray(cfg.services)
        ? cfg.services
        : [];
      if (services.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Tratamientos de Estética y Bienestar",
          itemListElement: services.slice(0, 12).map((srv: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: srv.title || srv.name || "Tratamiento Facial",
              description: srv.desc || srv.description || undefined,
            },
            price: typeof srv.price === "number" ? srv.price : parseFloat(String(srv.price || "0").replace(/[^0-9.]/g, "")) || 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    case "clinica": {
      const especialidades = Array.isArray(cfg.especialidades)
        ? cfg.especialidades
        : Array.isArray(cfg.clinicaServices)
        ? cfg.clinicaServices
        : [];
      if (especialidades.length > 0) {
        schema.availableService = especialidades.slice(0, 12).map((esp: any) => ({
          "@type": "MedicalSpecialty",
          name: esp.title || esp.name || esp.especialidad || "Consulta Médica",
          description: esp.desc || esp.description || undefined,
        }));
      }
      break;
    }

    case "taller": {
      const services = Array.isArray(cfg.tallerServices)
        ? cfg.tallerServices
        : Array.isArray(cfg.services)
        ? cfg.services
        : [];
      if (services.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Servicios Mecánicos y Mantenimiento Vehicular",
          itemListElement: services.slice(0, 12).map((srv: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: srv.title || srv.name || "Service Integral",
              description: srv.desc || srv.description || undefined,
            },
            price: typeof srv.price === "number" ? srv.price : parseFloat(String(srv.price || "0").replace(/[^0-9.]/g, "")) || 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    case "lavadero": {
      const vehiculos = Array.isArray(cfg.vehiculos) ? cfg.vehiculos : [];
      if (vehiculos.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Servicios de Lavado y Estética Automotriz",
          itemListElement: vehiculos.slice(0, 12).map((v: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: `Lavado ${v.tipo || v.name || "Vehicular"}`,
              description: v.descripcion || v.desc || undefined,
            },
            price: typeof v.precio === "number" ? v.precio : typeof v.price === "number" ? v.price : 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    case "gimnasio": {
      const planes = Array.isArray(cfg.planes) ? cfg.planes : [];
      if (planes.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Membresías y Planes de Entrenamiento",
          itemListElement: planes.slice(0, 8).map((plan: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: plan.name || plan.titulo || "Pase Mensual",
              description: plan.description || plan.desc || undefined,
            },
            price: typeof plan.price === "number" ? plan.price : typeof plan.precio === "number" ? plan.precio : 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    case "cancha": {
      const tarifas = Array.isArray(cfg.canchaTarifas)
        ? cfg.canchaTarifas
        : Array.isArray(cfg.canchas)
        ? cfg.canchas
        : [];
      if (tarifas.length > 0) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Alquiler de Canchas y Turnos Deportivos",
          itemListElement: tarifas.slice(0, 8).map((c: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: c.nombre || c.name || "Alquiler de Cancha",
              description: c.descripcion || c.tipo || undefined,
            },
            price: typeof c.precio === "number" ? c.precio : typeof c.price === "number" ? c.price : 0,
            priceCurrency: "ARS",
          })),
        };
      }
      break;
    }

    default:
      break;
  }

  // Safe JSON serialization escaping dangerous characters
  const safeJson = JSON.stringify(schema).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
