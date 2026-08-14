import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// SEC-018 Fix: Simple rate limiter (in-memory for Phase 1)
const REGISTER_RATE_LIMIT = new Map<string, { count: number, timestamp: number }>();

export async function POST(req: Request) {
  try {
    // SEC-018 Fix: Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    const now = Date.now();
    const rateRecord = REGISTER_RATE_LIMIT.get(ip) || { count: 0, timestamp: now };
    
    if (now - rateRecord.timestamp > 3600000) { // 1 hour
      rateRecord.count = 0;
      rateRecord.timestamp = now;
    }
    if (rateRecord.count >= 5) {
      return NextResponse.json({ message: "Demasiados registros desde esta IP. Intenta más tarde." }, { status: 429 });
    }

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    // SEC-P1-005 Fix: Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // SEC-P1-005 Fix: Rate limit by email
    const emailRateRecord = REGISTER_RATE_LIMIT.get(normalizedEmail) || { count: 0, timestamp: now };
    if (now - emailRateRecord.timestamp > 3600000) {
      emailRateRecord.count = 0;
      emailRateRecord.timestamp = now;
    }
    if (emailRateRecord.count >= 3) {
      return NextResponse.json({ message: "Demasiados intentos para este email. Intenta más tarde." }, { status: 429 });
    }

    // SEC-019 Fix: Password Policy
    if (password.length < 8) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return NextResponse.json({ message: "El usuario ya existe" }, { status: 400 });
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

    // SEC-018 Fix: Increment rate limit only on success
    rateRecord.count++;
    REGISTER_RATE_LIMIT.set(ip, rateRecord);
    
    emailRateRecord.count++;
    REGISTER_RATE_LIMIT.set(normalizedEmail, emailRateRecord);

    return NextResponse.json({ message: "Usuario y negocio creados con éxito" }, { status: 201 });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}