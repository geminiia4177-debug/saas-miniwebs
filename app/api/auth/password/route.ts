import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

const PWD_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const PWD_MAX_ATTEMPTS = 5;

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // P1-001: Rate limit password change attempts
    const rateLimitKey = `pwd_change:user:${session.user.id}`;
    if (!(await checkRateLimit(rateLimitKey, PWD_MAX_ATTEMPTS, PWD_RATE_WINDOW_MS, { failClosed: true }))) {
      return NextResponse.json(
        { error: "Demasiados intentos de cambio de contraseña. Por favor intenta en 15 minutos." },
        { status: 429 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // P1-005: Enforce Password Policy
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const weakPasswords = ["12345678", "password", "admin123", "qwertyui", "123456789", "password123"];
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      return NextResponse.json({ error: "Por favor elige una contraseña más segura" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Usuario no encontrado o no tiene contraseña configurada." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 } 
      },
    });

    return NextResponse.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error cambiando contraseña:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
