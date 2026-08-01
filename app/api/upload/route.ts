import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
