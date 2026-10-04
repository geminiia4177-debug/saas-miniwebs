import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { z } from "zod";

const AI_RATE_WINDOW_MS = 60_000;
const AI_RATE_MAX = 8;

const CopywriterSchema = z.object({
  businessId: z.string().min(1).max(100),
  fieldType: z.enum(["heroTitle", "heroSubtitle", "description", "service", "tagline"]),
  currentText: z.string().max(1000).optional().default(""),
  context: z.string().max(500).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userKey = `ai:copywriter:${session.user.id}`;
    if (!(await checkRateLimit(userKey, AI_RATE_MAX, AI_RATE_WINDOW_MS, { failClosed: true }))) {
      const retryAfter = Math.ceil((await getRateLimitRetryAfterMs(userKey, AI_RATE_WINDOW_MS)) / 1000);
      return NextResponse.json(
        { error: "Demasiadas solicitudes a la IA. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback mock suggestions if key is missing in dev environment
      return NextResponse.json({
        suggestions: [
          "Calidad insuperable, dedicación y estilo único en cada detalle.",
          "Transformá tu experiencia con atención profesional y resultados garantizados.",
          "Tu lugar de confianza: reservas directas y atención exclusiva.",
        ],
      });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = CopywriterSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { businessId, fieldType, currentText, context } = parseResult.data;

    // Verify tenancy
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

    const prompt = `Actúa como un redactor publicitario senior (copywriter) para un negocio llamado "${business.name}" (Rubro: ${business.type}).
Tu tarea es reescribir o proponer 3 variaciones irresistibles y de alta conversión para el campo "${fieldType}".
Texto actual: "${currentText || "Sin texto previo"}".
Contexto adicional: "${context}".

Reglas estrictas:
- Redacción moderna, profesional, persuasiva, en español rioplatense neutro.
- Longitud adecuada para un sitio web (títulos cortos e impactantes, subtítulos explicativos de 1 a 2 oraciones).
- Responde ÚNICAMENTE en formato JSON con la clave "suggestions" como un array de 3 strings, sin texto adicional antes o después. Ejemplo: {"suggestions": ["Opcion 1", "Opcion 2", "Opcion 3"]}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const outputText = response.text || "";
    try {
      const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return NextResponse.json({ suggestions: parsed.suggestions.slice(0, 3) });
      }
    } catch {
      // Fallback extraction
      const lines = outputText.split("\n").filter((l) => l.trim().length > 5).slice(0, 3);
      if (lines.length > 0) {
        return NextResponse.json({ suggestions: lines });
      }
    }

    return NextResponse.json({
      suggestions: [
        "Experiencia superior pensada para superar tus expectativas.",
        "Calidad garantizada y atención personalizada en cada momento.",
        "El servicio que buscas con la comodidad que mereces.",
      ],
    });
  } catch (err: any) {
    console.error("AI Copywriter error:", err);
    return NextResponse.json(
      { error: "Error al generar sugerencias con IA" },
      { status: 500 }
    );
  }
}
