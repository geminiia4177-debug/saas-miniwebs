import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitRetryAfterMs, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const OnboardingInputSchema = z.object({
  businessId: z.string().optional(),
  businessName: z.string().min(2).max(100),
  niche: z.enum([
    "barberia",
    "estetica",
    "menu",
    "taller",
    "lavadero",
    "clinica",
    "cancha",
    "gimnasio",
    "tienda",
    "general"
  ]),
  vibe: z.enum(["barrio", "premium", "modern"]).default("barrio"),
  whatsapp: z.string().max(30).optional(),
  instagram: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
});

interface GeneratedTemplateData {
  themeVariant: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  services: Array<{ id: string; name: string; price: number; duration: number; description: string; active: boolean }>;
  hours: Record<string, { open: boolean; from: string; to: string }>;
  antiNoShowEnabled: boolean;
  loyaltyEnabled: boolean;
  loyaltyGoal: number;
  loyaltyReward: string;
  reviewsEnabled: boolean;
}

// Heurísticas especializadas para el mercado de México 🇲🇽
function generateMexicanPresets(name: string, niche: string, vibe: "barrio" | "premium" | "modern"): GeneratedTemplateData {
  const isPremium = vibe === "premium";

  switch (niche) {
    case "barberia": {
      return {
        themeVariant: isPremium ? "urban_fade" : "el_patron",
        primaryColor: isPremium ? "#06B6D4" : "#c5a254",
        secondaryColor: isPremium ? "#8B5CF6" : "#111111",
        accentColor: isPremium ? "#06B6D4" : "#c5a254",
        heroTitle: isPremium ? `FADE & STYLE — ${name.toUpperCase()}` : `${name.toUpperCase()} — EL CORTE DEL PATRÓN`,
        heroSubtitle: isPremium
          ? "Cortes de tendencia, degradados milimétricos y el mejor ambiente urbano."
          : "Tradición, navaja clásica, toalla caliente y el trato que te mereces.",
        ctaText: "Apartar Cita por WhatsApp",
        services: isPremium
          ? [
              { id: "srv_1", name: "Corte Fade Signature + Peinado", price: 280, duration: 40, description: "Degradado a piel con navaja, textura y fijación mate.", active: true },
              { id: "srv_2", name: "Perfilado de Barba + Vapor Ozono", price: 200, duration: 30, description: "Alineación de barba, aceite hidratante y toalla caliente.", active: true },
              { id: "srv_3", name: "Combo Patrón (Corte + Barba)", price: 420, duration: 60, description: "Servicio completo con exfoliación facial express.", active: true },
              { id: "srv_4", name: "Platinado / Tinte Global", price: 650, duration: 90, description: "Decoloración profesional y matizado cenizo.", active: true },
              { id: "srv_5", name: "Diseño de Grecas / Freestyle", price: 150, duration: 25, description: "Líneas y patrones personalizados con navaja.", active: true },
              { id: "srv_6", name: "Black Mask Puntos Negros", price: 120, duration: 20, description: "Limpieza profunda de poros con mascarilla de carbón.", active: true },
            ]
          : [
              { id: "srv_1", name: "Corte Clásico / Escolar", price: 100, duration: 30, description: "Tijera o máquina, limpio, rápido y parejo.", active: true },
              { id: "srv_2", name: "Corte y Barba Tradicional", price: 180, duration: 45, description: "Arreglo completo con espuma caliente y loción.", active: true },
              { id: "srv_3", name: "Afeitado Clásico con Navaja", price: 100, duration: 25, description: "Rasurado al ras con masaje relajante.", active: true },
              { id: "srv_4", name: "Corte Niño / Caballero", price: 90, duration: 25, description: "Atención paciente para los más peques.", active: true },
              { id: "srv_5", name: "Corte de Ceja / Perfilado", price: 40, duration: 15, description: "Limpieza y simetría con navaja desechable.", active: true },
              { id: "srv_6", name: "Aplicación de Tinte de Barba", price: 120, duration: 30, description: "Cubre canas natural de larga duración.", active: true },
            ],
        hours: {
          lunes: { open: true, from: "10:00", to: "20:30" },
          martes: { open: true, from: "10:00", to: "20:30" },
          miercoles: { open: true, from: "10:00", to: "20:30" },
          jueves: { open: true, from: "10:00", to: "20:30" },
          viernes: { open: true, from: "10:00", to: "21:00" },
          sabado: { open: true, from: "09:30", to: "21:00" },
          domingo: { open: true, from: "10:00", to: "16:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: true,
        loyaltyGoal: 6,
        loyaltyReward: "Corte gratis en tu 6ta visita",
        reviewsEnabled: false,
      };
    }

    case "menu": {
      return {
        themeVariant: isPremium ? "cantina_gourmet" : "trompo",
        primaryColor: isPremium ? "#F59E0B" : "#d32f2f",
        secondaryColor: isPremium ? "#EF4444" : "#ffc107",
        accentColor: isPremium ? "#F59E0B" : "#ffc107",
        heroTitle: isPremium ? `${name} — GASTROBAR & BRASAS` : `TACOS & ANTOJITOS — ${name.toUpperCase()}`,
        heroSubtitle: isPremium
          ? "Café de grano mexicano, pan recién horneado y platillos hechos con calma."
          : "Pastor doradito, suadero suave, birria calientita y salsas recién hechas.",
        ctaText: isPremium ? "Ver Carta Digital" : "Pedir por WhatsApp",
        services: isPremium
          ? [
              { id: "prd_1", name: "Flat White de Especialidad", price: 65, duration: 10, description: "Espresso doble con microespuma sedosa (Grano de Chiapas).", active: true },
              { id: "prd_2", name: "Avocado Toast con Huevo Poché", price: 145, duration: 15, description: "Pan campesino de masa madre, aguacate hass y semillas.", active: true },
              { id: "prd_3", name: "Croissant de Almendras", price: 75, duration: 5, description: "Horneado diario con frangipane y almendras tostadas.", active: true },
              { id: "prd_4", name: "Cold Brew Infusión 18h", price: 70, duration: 5, description: "Extracción lenta en frío, notas a chocolate amargo.", active: true },
              { id: "prd_5", name: "Chilaquiles con Cecina de Yecapixtla", price: 165, duration: 20, description: "Totopos crujientes, salsa verde tatemada, crema de rancho y queso fresco.", active: true },
              { id: "prd_6", name: "Matcha Ceremonial Latte", price: 80, duration: 10, description: "Matcha japonés orgánico batido con leche vegetal.", active: true },
            ]
          : [
              { id: "prd_1", name: "Orden de Tacos al Pastor (5 pzas)", price: 85, duration: 10, description: "Carne adobada en trompo con piña, cilantro y cebolla.", active: true },
              { id: "prd_2", name: "Gringa Especial con Queso", price: 60, duration: 10, description: "Doble tortilla de harina, pastor doradito y queso Oaxaca derretido.", active: true },
              { id: "prd_3", name: "Orden de Suadero Confitado (5 pzas)", price: 90, duration: 10, description: "Suave y jugoso, dorado a la plancha.", active: true },
              { id: "prd_4", name: "Quesataco de Birria con Consomé", price: 75, duration: 10, description: "Tortilla doradita en grasa de birria con queso y consomé para chopear.", active: true },
              { id: "prd_5", name: "Alambre Pastor con Tocino y Morrones", price: 140, duration: 15, description: "Para 2 personas. Acompañado de 10 tortillas calientitas.", active: true },
              { id: "prd_6", name: "Agua Fresca de Horchata o Jamaica (1L)", price: 40, duration: 5, description: "100% natural, bien fría.", active: true },
            ],
        hours: {
          lunes: { open: true, from: "18:00", to: "02:00" },
          martes: { open: true, from: "18:00", to: "02:00" },
          miercoles: { open: true, from: "18:00", to: "02:00" },
          jueves: { open: true, from: "18:00", to: "02:30" },
          viernes: { open: true, from: "17:30", to: "03:30" },
          sabado: { open: true, from: "17:30", to: "03:30" },
          domingo: { open: true, from: "18:00", to: "01:00" },
        },
        antiNoShowEnabled: false,
        loyaltyEnabled: true,
        loyaltyGoal: 8,
        loyaltyReward: "Gringa o bebida gratis en tu 8va orden",
        reviewsEnabled: false,
      };
    }

    case "taller": {
      return {
        themeVariant: isPremium ? "motorsport" : "el_jefe",
        primaryColor: isPremium ? "#0a0a0a" : "#0d1b2a",
        secondaryColor: isPremium ? "#00e5ff" : "#ff6b00",
        accentColor: isPremium ? "#00e5ff" : "#ff6b00",
        heroTitle: `${name.toUpperCase()} — SERVICIO MECÁNICO DE CONFIANZA`,
        heroSubtitle: "Diagnóstico honesto, refacciones con garantía y entrega puntual para tu vehículo.",
        ctaText: "Cotizar / Agendar por WhatsApp",
        services: [
          { id: "srv_1", name: "Afinación Mayor 4 Cilindros", price: 1250, duration: 120, description: "Bujías, lavado de inyectores, cuerpo de aceleración y cambio de filtros.", active: true },
          { id: "srv_2", name: "Cambio de Aceite Sintético y Filtro", price: 850, duration: 45, description: "Aceite 5W-30 / 0W-20 multigrado de marca premium.", active: true },
          { id: "srv_3", name: "Servicio de Frenos (Balatas Delanteras)", price: 650, duration: 60, description: "Inspección de discos, rectificado y purga de líquido.", active: true },
          { id: "srv_4", name: "Escaneo por Computadora (Check Engine)", price: 250, duration: 30, description: "Lectura de códigos OBD-II y diagnóstico computarizado.", active: true },
          { id: "srv_5", name: "Limpieza y Carga de Aire Acondicionado", price: 700, duration: 60, description: "Detección de fugas y recarga de gas ecológico R134a.", active: true },
          { id: "srv_6", name: "Revisión Preventiva 25 Puntos", price: 350, duration: 45, description: "Suspensión, dirección, luces, niveles y bandas.", active: true },
        ],
        hours: {
          lunes: { open: true, from: "09:00", to: "19:00" },
          martes: { open: true, from: "09:00", to: "19:00" },
          miercoles: { open: true, from: "09:00", to: "19:00" },
          jueves: { open: true, from: "09:00", to: "19:00" },
          viernes: { open: true, from: "09:00", to: "19:00" },
          sabado: { open: true, from: "09:00", to: "15:00" },
          domingo: { open: false, from: "09:00", to: "14:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: false,
        loyaltyGoal: 4,
        loyaltyReward: "Escaneo computarizado gratis en tu 4to servicio",
        reviewsEnabled: false,
      };
    }

    case "estetica":
    case "unas": {
      return {
        themeVariant: isPremium ? "glitz_lash" : "unas",
        primaryColor: isPremium ? "#EC4899" : "#fff0f5",
        secondaryColor: isPremium ? "#F43F5E" : "#e91e63",
        accentColor: isPremium ? "#EC4899" : "#e91e63",
        heroTitle: `${name} — UÑAS, PESTAÑAS & BELLEZA`,
        heroSubtitle: "Diseños que te hacen brillar. Cuidado profesional y materiales de primera calidad.",
        ctaText: "Agendar Cita por WhatsApp",
        services: [
          { id: "srv_1", name: "Aplicación de Uñas Acrílicas (Diseño Básico)", price: 380, duration: 90, description: "Punta almendra, coffin o cuadrada con gel semipermanente.", active: true },
          { id: "srv_2", name: "Esmaltado en Gelish (Manos)", price: 180, duration: 45, description: "Limpieza de cutícula, limado y color de larga duración (21 días).", active: true },
          { id: "srv_3", name: "Lifting de Pestañas + Tinte", price: 320, duration: 60, description: "Realce natural con efecto máscara sin maltratar tu pestaña.", active: true },
          { id: "srv_4", name: "Retoque de Acrílico", price: 250, duration: 60, description: "Relleno de crecimiento y cambio de diseño.", active: true },
          { id: "srv_5", name: "Pedicure Spa Profundo", price: 300, duration: 60, description: "Exfoliación, retiro de asperezas, masaje y gelish en pies.", active: true },
          { id: "srv_6", name: "Diseño y Laminado de Cejas", price: 250, duration: 45, description: "Perfilado con cera o hilo y fijación peinada orgánica.", active: true },
        ],
        hours: {
          lunes: { open: true, from: "10:00", to: "19:30" },
          martes: { open: true, from: "10:00", to: "19:30" },
          miercoles: { open: true, from: "10:00", to: "19:30" },
          jueves: { open: true, from: "10:00", to: "20:00" },
          viernes: { open: true, from: "10:00", to: "20:00" },
          sabado: { open: true, from: "09:30", to: "19:00" },
          domingo: { open: false, from: "10:00", to: "15:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: true,
        loyaltyGoal: 5,
        loyaltyReward: "Diseño especial gratis en tu 5ta aplicación",
        reviewsEnabled: false,
      };
    }

    case "dental": {
      return {
        themeVariant: isPremium ? "holistic_spa" : "dental",
        primaryColor: isPremium ? "#0D9488" : "#0284C7",
        secondaryColor: isPremium ? "#D97706" : "#0369A1",
        accentColor: isPremium ? "#0D9488" : "#0284C7",
        heroTitle: `${name} — SALUD & ESTÉTICA DENTAL`,
        heroSubtitle: "Odontología de vanguardia, diseño de sonrisa digital y atención sin dolor.",
        ctaText: "Agendar Consulta",
        services: [
          { id: "srv_1", name: "Limpieza Dental con Ultrasonido", price: 550, duration: 45, description: "Eliminación de sarro, pulido dental y flúor protector.", active: true },
          { id: "srv_2", name: "Blanqueamiento Láser en 1 Sesión", price: 2200, duration: 60, description: "Aclara hasta 6 tonos sin dañar el esmalte dental.", active: true },
          { id: "srv_3", name: "Valoración Digital 3D + Radiografía", price: 400, duration: 30, description: "Diagnóstico completo computarizado de tu sonrisa.", active: true },
        ],
        hours: {
          lunes: { open: true, from: "09:00", to: "19:00" },
          martes: { open: true, from: "09:00", to: "19:00" },
          miercoles: { open: true, from: "09:00", to: "19:00" },
          jueves: { open: true, from: "09:00", to: "19:00" },
          viernes: { open: true, from: "09:00", to: "19:00" },
          sabado: { open: true, from: "09:00", to: "14:00" },
          domingo: { open: false, from: "10:00", to: "13:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: false,
        loyaltyGoal: 4,
        loyaltyReward: "Limpieza preventiva gratis",
        reviewsEnabled: false,
      };
    }

    case "veterinaria": {
      return {
        themeVariant: isPremium ? "pet_resort" : "veterinaria",
        primaryColor: isPremium ? "#10B981" : "#059669",
        secondaryColor: isPremium ? "#F59E0B" : "#047857",
        accentColor: isPremium ? "#10B981" : "#059669",
        heroTitle: `${name} — CUIDADO & HOTEL CANINO`,
        heroSubtitle: "Amor y salud para tu mejor amigo. Consultas, vacunas y guardería campestre.",
        ctaText: "Apartar Cita por WhatsApp",
        services: [
          { id: "srv_1", name: "Consulta Médica General", price: 350, duration: 30, description: "Revisión completa, signos vitales y diagnóstico.", active: true },
          { id: "srv_2", name: "Vacuna Séxtuple o Antirrábica", price: 400, duration: 20, description: "Aplicación y sellado en cartilla oficial.", active: true },
          { id: "srv_3", name: "Hospedaje VIP sin Jaulas (Por Noche)", price: 450, duration: 60, description: "Habitación climatizada, paseos y fotos cada 2h.", active: true },
        ],
        hours: {
          lunes: { open: true, from: "09:00", to: "20:00" },
          martes: { open: true, from: "09:00", to: "20:00" },
          miercoles: { open: true, from: "09:00", to: "20:00" },
          jueves: { open: true, from: "09:00", to: "20:00" },
          viernes: { open: true, from: "09:00", to: "20:00" },
          sabado: { open: true, from: "09:00", to: "18:00" },
          domingo: { open: true, from: "10:00", to: "15:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: true,
        loyaltyGoal: 6,
        loyaltyReward: "Baño o noche de guardería gratis",
        reviewsEnabled: false,
      };
    }

    default: {
      return {
        themeVariant: "modern",
        primaryColor: "#0f172a",
        secondaryColor: "#3b82f6",
        accentColor: "#3b82f6",
        heroTitle: `${name.toUpperCase()} — TU MEJOR OPCIÓN`,
        heroSubtitle: "Atención personalizada, productos de calidad y servicio garantizado.",
        ctaText: "Contactar por WhatsApp",
        services: [
          { id: "srv_1", name: "Servicio Estándar", price: 250, duration: 45, description: "Atención profesional inmediata.", active: true },
          { id: "srv_2", name: "Servicio Completo / Pro", price: 450, duration: 60, description: "Solución integral con garantía.", active: true },
          { id: "srv_3", name: "Asesoría Personalizada", price: 150, duration: 30, description: "Evaluación sin compromiso de tu caso.", active: true },
        ],
        hours: {
          lunes: { open: true, from: "09:00", to: "19:00" },
          martes: { open: true, from: "09:00", to: "19:00" },
          miercoles: { open: true, from: "09:00", to: "19:00" },
          jueves: { open: true, from: "09:00", to: "19:00" },
          viernes: { open: true, from: "09:00", to: "19:00" },
          sabado: { open: true, from: "09:00", to: "16:00" },
          domingo: { open: false, from: "10:00", to: "14:00" },
        },
        antiNoShowEnabled: true,
        loyaltyEnabled: true,
        loyaltyGoal: 5,
        loyaltyReward: "Descuento en tu próxima visita",
        reviewsEnabled: false,
      };
    }
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipKey = `onboarding:${ip}`;
    if (!(await checkRateLimit(ipKey, 10, 60_000, { failClosed: true }))) {
      const retryAfter = Math.ceil((await getRateLimitRetryAfterMs(ipKey, 60_000)) / 1000);
      return NextResponse.json(
        { error: "Demasiadas solicitudes de generación. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = OnboardingInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de negocio inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { businessId, businessName, niche, vibe, whatsapp, instagram, address } = parsed.data;

    // Generar configuración preestablecida hiper-optimizada para México
    const preset = generateMexicanPresets(businessName, niche, vibe);

    const generatedLayoutConfig = {
      heroTitle: preset.heroTitle,
      heroSubtitle: preset.heroSubtitle,
      ctaText: preset.ctaText,
      themeVariant: preset.themeVariant,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      whatsapp: whatsapp || "",
      instagram: instagram || "",
      address: address || "",
      hours: preset.hours,
      antiNoShowEnabled: preset.antiNoShowEnabled,
      loyaltyEnabled: preset.loyaltyEnabled,
      loyaltyGoal: preset.loyaltyGoal,
      loyaltyReward: preset.loyaltyReward,
      reviewsEnabled: preset.reviewsEnabled,
      // Servicios específicos según el nicho
      ...(niche === "barberia" ? { barberiaServices: preset.services, services: preset.services } : {}),
      ...(niche === "menu" ? { menuCategorias: [{ id: "cat_1", name: "Especialidades", products: preset.services }], services: preset.services } : {}),
      ...(niche === "taller" ? { tallerServices: preset.services, services: preset.services } : {}),
      ...(niche === "estetica" ? { esteticaServices: preset.services, servicios: preset.services, services: preset.services } : {}),
      ...(niche !== "barberia" && niche !== "menu" && niche !== "taller" && niche !== "estetica" ? { services: preset.services } : {}),
      sections: [
        { id: "hero", label: "Hero / Portada", visible: true },
        { id: "services", label: "Servicios y Precios", visible: true },
        { id: "loyalty", label: "Tarjeta de Sellos / Fidelización", visible: preset.loyaltyEnabled },
        { id: "hours", label: "Horarios y Ubicación", visible: true },
        { id: "booking", label: "Agendar Turno / Pedido", visible: true },
      ],
    };

    // Si se pasa un businessId verificado, podemos guardar el borrador directamente
    if (businessId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const existingBiz = await prisma.business.findUnique({
          where: { id: businessId },
          select: { userId: true, layoutConfig: true },
        });

        if (existingBiz && (session.user.role === "ADMIN" || existingBiz.userId === session.user.id)) {
          const mergedConfig = {
            ...(existingBiz.layoutConfig as any || {}),
            ...generatedLayoutConfig,
          };

          await prisma.business.update({
            where: { id: businessId },
            data: {
              layoutConfig: mergedConfig,
              primaryColor: preset.primaryColor,
              secondaryColor: preset.secondaryColor,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      businessName,
      niche,
      layoutConfig: generatedLayoutConfig,
      message: "¡Página generada con éxito en 60 segundos lista para editar y publicar!",
    });
  } catch (err: any) {
    console.error("Error en Onboarding Mágico IA:", err?.message || err);
    return NextResponse.json({ error: "Error al generar la configuración inicial" }, { status: 500 });
  }
}
