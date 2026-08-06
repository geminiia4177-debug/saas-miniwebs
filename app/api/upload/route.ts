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
