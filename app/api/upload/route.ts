import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Verificamos que esté logueado
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // SEC-009: Pre-validar tamaño por header ANTES de cargar en memoria
    const contentLength = req.headers.get("content-length");
    const MAX_SIZE = 5 * 1024 * 1024;
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande (pre-check)." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB." }, { status: 413 });
    }

    // SEC-022 Fix: Validate MIME type strictly
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes (JPEG, PNG, WEBP)." }, { status: 400 });
    }

    // SEC-022, SEC-010 Fix: Magic bytes validation
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer).subarray(0, 12); // Necesitamos 12 bytes para WEBP
    const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    
    let isImage = false;
    if (header.startsWith('ffd8')) isImage = true; // JPEG
    else if (header.startsWith('89504e47')) isImage = true; // PNG
    else if (header.startsWith('52494646') && header.substring(16, 24) === '57454250') isImage = true; // RIFF + WEBP
    
    if (!isImage) {
      return NextResponse.json({ error: "Contenido de archivo inválido o formato no soportado real." }, { status: 400 });
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", file);
    
    // We try to use a secure non-public env variable if available, else fallback to the public one.
    const key = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    
    if (!key) {
      return NextResponse.json({ error: "Missing ImgBB API Key" }, { status: 500 });
    }

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body: imgbbFormData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("ImgBB error:", errorText);
      throw new Error("ImgBB upload failed");
    }

    const data = await res.json();
    // Rate limit can be implemented via DB if required, currently omitted.

    return NextResponse.json({ url: data.data.url });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
