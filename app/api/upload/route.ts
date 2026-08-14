import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Verificamos que esté logueado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // SEC-022 Fix: Validate MIME type strictly
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes (JPEG, PNG, WEBP)." }, { status: 400 });
    }

    // SEC-022 Fix: Basic magic bytes validation to prevent malicious fake extensions
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer).subarray(0, 4);
    const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    
    let isImage = false;
    if (header.startsWith('ffd8')) isImage = true; // JPEG
    else if (header.startsWith('89504e47')) isImage = true; // PNG
    else if (header.startsWith('52494646')) isImage = true; // WEBP (starts with RIFF)
    
    if (!isImage) {
      return NextResponse.json({ error: "Contenido de archivo inválido." }, { status: 400 });
    }

    // 2. Límite de tamaño: 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB." }, { status: 413 });
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
    return NextResponse.json({ url: data.data.url });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
