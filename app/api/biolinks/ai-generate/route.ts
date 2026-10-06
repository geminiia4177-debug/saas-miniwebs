import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const RequestSchema = z.object({
  businessId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parse = RequestSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }

    const { businessId } = parse.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (business.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const layout = (business.layoutConfig as any) || {};
    const bizName = business.name || "Mi Negocio";
    const bizType = business.type || "general";
    const phone = business.phone || layout.contact?.phone || layout.contact?.whatsapp || "";
    const address = layout.contact?.address || "";
    const publicUrl = `https://${business.subdomain || "negocio"}.saas-miniwebs.vercel.app`;

    const prompt = `Actúa como un Especialista en Conversión Digital y Redes Sociales.
Genera una estructura optimizada de BioLinks (página estilo Linktree de alta conversión) para "${bizName}" (Rubro: ${bizType}).
Datos reales disponibles:
- URL de la Landing Web oficial: ${publicUrl}
- Teléfono / WhatsApp: ${phone || "Consultar por privado"}
- Dirección local: ${address || "Atención con cita previa"}

Genera una lista de 5 a 6 enlaces estratégicos ordenados por conversión (el primero debe ser el llamado principal, ej: Reservar Turno o Pedir por WhatsApp).
Para cada enlace:
- "label": Texto persuasivo y claro del botón (ej: "📅 Reservar Turno Online", "💬 Hablar por WhatsApp", "📍 Cómo Llegar al Local", "🌐 Ver Nuestra Web Oficial", "⭐ Ver Lista de Precios").
- "url": URL de destino sugerida (usa ${publicUrl} o enlace de WhatsApp con wa.me/${phone.replace(/[^0-9]/g, "")} si hay teléfono).
- "icon": Nombre de icono semántico (ej: "calendar", "message-circle", "map-pin", "globe", "star", "instagram").
- "type": "turnos" | "whatsapp" | "map" | "link".
- "featured": boolean (solo TRUE en el enlace estrella más importante).
- "animation": "pulse" | "bounce" | "none".

Además genera:
- "title": Título breve de la bio (ej: "${bizName} · Oficial").
- "bio": Descripción corta, atractiva y profesional (máximo 85 caracteres con emojis).

Responde ÚNICAMENTE en JSON válido con esta estructura:
{
  "title": "${bizName} · Oficial",
  "bio": "Los mejores servicios y atención personalizada. ¡Elegí tu opción abajo! 👇",
  "items": [
    {
      "id": "1",
      "label": "📅 Reservar Turno Online",
      "url": "${publicUrl}/turnos",
      "icon": "calendar",
      "type": "turnos",
      "featured": true,
      "animation": "pulse"
    }
  ]
}`;

    let generatedData = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        for (const m of models) {
          try {
            const res = await ai.models.generateContent({
              model: m,
              contents: prompt,
              config: { responseMimeType: "application/json" },
            });
            if (res.text) {
              const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              if (parsed.title && Array.isArray(parsed.items) && parsed.items.length >= 3) {
                generatedData = parsed;
                break;
              }
            }
          } catch {}
        }
      } catch (e) {
        console.warn("Gemini BioLinks generation error:", e);
      }
    }

    if (!generatedData) {
      // Fallback
      const waNumber = phone.replace(/[^0-9]/g, "");
      generatedData = {
        title: `${bizName} · Enlaces Oficiales`,
        bio: `¡Bienvenido a ${bizName}! Conocé todos nuestros canales de atención directa. 👇`,
        items: [
          {
            id: "ai-1",
            label: "📅 Reservar Turno Online",
            url: `${publicUrl}/turnos`,
            icon: "calendar",
            type: "turnos",
            featured: true,
            animation: "pulse",
            clicks: 0,
          },
          ...(waNumber
            ? [
                {
                  id: "ai-2",
                  label: "💬 Chatear por WhatsApp",
                  url: `https://wa.me/${waNumber}?text=Hola%20${encodeURIComponent(bizName)}%2C%20quisiera%20hacer%20una%20consulta`,
                  icon: "message-circle",
                  type: "whatsapp",
                  featured: false,
                  animation: "none",
                  clicks: 0,
                },
              ]
            : []),
          {
            id: "ai-3",
            label: "🌐 Visitar Sitio Web Oficial",
            url: publicUrl,
            icon: "globe",
            type: "link",
            featured: false,
            animation: "none",
            clicks: 0,
          },
          ...(address
            ? [
                {
                  id: "ai-4",
                  label: `📍 Ubicación: ${address.slice(0, 30)}`,
                  url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                  icon: "map-pin",
                  type: "map",
                  featured: false,
                  animation: "none",
                  clicks: 0,
                },
              ]
            : []),
          {
            id: "ai-5",
            label: "⭐ Ver Servicios y Precios",
            url: `${publicUrl}#servicios`,
            icon: "star",
            type: "link",
            featured: false,
            animation: "none",
            clicks: 0,
          },
        ],
      };
    }

    // Asegurar IDs únicos para cada item
    const formattedItems = (generatedData.items || []).map((item: any, i: number) => ({
      id: item.id || `link-${Date.now()}-${i}`,
      label: item.label || "Enlace",
      url: item.url || publicUrl,
      icon: item.icon || "globe",
      type: item.type || "link",
      featured: Boolean(item.featured),
      animation: item.animation || "none",
      clicks: 0,
      active: true,
    }));

    return NextResponse.json({
      success: true,
      title: generatedData.title,
      bio: generatedData.bio,
      items: formattedItems,
      message: "BioLinks generados exitosamente con IA",
    });
  } catch (error: any) {
    console.error("AI BioLinks generation error:", error);
    return NextResponse.json({ error: "Error al generar BioLinks con IA" }, { status: 500 });
  }
}
