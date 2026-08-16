import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const REG_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const REG_MAX_IP = 5;
const REG_MAX_EMAIL = 3;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown_ip";

    // P1-004: Rate limit by IP
    const ipAllowed = await checkRateLimit(`reg:ip:${ip}`, REG_MAX_IP, REG_WINDOW_MS, { failClosed: true });
    if (!ipAllowed) {
      return NextResponse.json({ message: "Demasiados registros desde esta IP. Intenta más tarde." }, { status: 429 });
    }

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // P1-004: Rate limit by email
    const emailAllowed = await checkRateLimit(`reg:email:${normalizedEmail}`, REG_MAX_EMAIL, REG_WINDOW_MS, { failClosed: true });
    if (!emailAllowed) {
      return NextResponse.json({ message: "Demasiados intentos para este email. Intenta más tarde." }, { status: 429 });
    }

    // SEC-019 Fix: Password Policy
    if (password.length < 8) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      // P1-005: Do not reveal user existence. Wait artificially to prevent timing attack.
      await new Promise(r => setTimeout(r, 1500));
      return NextResponse.json({ message: "No se pudo completar el registro. Si ya tienes cuenta, por favor inicia sesión." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
      },
    });

    // Generate unique subdomain based on name
    // SEC-038 Fix: Secure subdomain generation
    const baseSubdomain = name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "negocio";
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const subdomain = `${baseSubdomain}-${randomSuffix}`;

    // Create default business for the user
    await prisma.business.create({
      data: {
        userId: user.id,
        name: name || "Mi Negocio",
        subdomain,
        type: "general",
        status: "ACTIVE",
        layoutConfig: {
          sections: [
            { id: "hero", type: "hero", visible: true, order: 0 },
            { id: "services", type: "services", visible: true, order: 1 },
            { id: "contact", type: "contact", visible: true, order: 2 }
          ]
        }
      }
    });

    return NextResponse.json({ message: "Usuario y negocio creados con éxito" }, { status: 201 });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}