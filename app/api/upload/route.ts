import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";

// ─── RATE LIMITER (Upload) ────────────────────────────────────────────────────
// P1-001: Limit uploads per IP and per user to prevent ImgBB API abuse.
const MAX_UPLOADS_PER_WINDOW = 20;
const WINDOW_MS = 60_000; // 1 minute

export async function POST(req: Request) {
  try {
    // 1. Authentication required
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. P1-001: Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipKey = `upload:ip:${ip}`;
    if (!(await checkRateLimit(ipKey, MAX_UPLOADS_PER_WINDOW, WINDOW_MS))) {
      const retryAfter = Math.ceil(await getRateLimitRetryAfterMs(ipKey, WINDOW_MS) / 1000);
      return NextResponse.json(
        { error: "Demasiadas subidas desde esta IP. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 3. P1-001: Rate limit by user
    const userKey = `upload:user:${session.user.id}`;
    if (!(await checkRateLimit(userKey, MAX_UPLOADS_PER_WINDOW, WINDOW_MS))) {
      const retryAfter = Math.ceil(await getRateLimitRetryAfterMs(userKey, WINDOW_MS) / 1000);
      return NextResponse.json(
        { error: "Límite de subidas alcanzado. Intenta en un minuto." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 4. Pre-validate size by Content-Length header BEFORE loading into memory
    const contentLength = req.headers.get("content-length");
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande (pre-check)." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const businessId = formData.get("businessId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 5. P1-031: businessId is mandatory for ownership verification
    if (!businessId) {
      return NextResponse.json({ error: "businessId es obligatorio" }, { status: 400 });
    }

    // 6. P1-031: Verify ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { userId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && business.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado para subir archivos a este negocio" }, { status: 403 });
    }

    // 7. Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB." }, { status: 413 });
    }

    // 8. Validate MIME type strictly
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes (JPEG, PNG, WEBP)." }, { status: 400 });
    }

    // 9. Magic bytes validation — verify actual file content matches declared type
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer).subarray(0, 12);
    const header = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    let isImage = false;
    if (header.startsWith("ffd8")) isImage = true; // JPEG
    else if (header.startsWith("89504e47")) isImage = true; // PNG
    else if (header.startsWith("52494646") && header.substring(16, 24) === "57454250") isImage = true; // RIFF+WEBP

    if (!isImage) {
      return NextResponse.json({ error: "Contenido de archivo inválido o formato no soportado." }, { status: 400 });
    }

    // 10. P0-002: Use ONLY the server-side IMGBB_API_KEY.
    // NEVER use NEXT_PUBLIC_IMGBB_API_KEY directly on the client.
    const key = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!key) {
      console.error("IMGBB_API_KEY is not configured");
      return NextResponse.json({ error: "Servicio de imágenes no disponible" }, { status: 500 });
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body: imgbbFormData,
    });

    if (!res.ok) {
      // Log internally without exposing external error detail
      console.error("ImgBB upload failed with status:", res.status);
      throw new Error("ImgBB upload failed");
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data.url });
  } catch (error) {
    console.error("Upload route error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}
