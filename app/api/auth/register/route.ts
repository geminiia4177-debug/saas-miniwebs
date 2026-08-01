import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ message: "El usuario ya existe" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Generate unique subdomain based on name
    const baseSubdomain = name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : "negocio";
    const randomSuffix = Math.random().toString(36).substring(2, 6);
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