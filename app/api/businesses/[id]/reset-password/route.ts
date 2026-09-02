import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            failedLoginCount: true,
            mustChangePassword: true,
            sessionVersion: true,
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    let rawBody: any = {};
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const { newPassword: customPassword, mustChangePassword = true } = rawBody;

    // Si el admin envía una contraseña específica, validamos longitud mínima
    let plainPassword = "";
    if (customPassword && typeof customPassword === "string" && customPassword.trim().length >= 6) {
      plainPassword = customPassword.trim();
    } else {
      // Generar contraseña legible y segura: ej. "Turno7492-Sol" o aleatoria segura de 10 caracteres
      const randomSuffix = crypto.randomBytes(4).toString("hex");
      plainPassword = `Pass-${Math.floor(1000 + Math.random() * 9000)}-${randomSuffix.slice(0, 4)}`;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    let targetUserId = business.userId;

    // Si el negocio no tiene usuario vinculado aún, buscar por email del negocio o crearlo
    if (!targetUserId || !business.user) {
      const email = business.email;
      if (!email) {
        return NextResponse.json({ error: "El negocio no tiene un email registrado para asociarle el acceso" }, { status: 400 });
      }

      let existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            email,
            name: business.name,
            password: hashedPassword,
            mustChangePassword,
            failedLoginCount: 0,
            sessionVersion: 1,
            passwordChangedAt: new Date(),
          }
        });
      }

      targetUserId = existingUser.id;

      // Vincular el negocio a este usuario
      await prisma.business.update({
        where: { id: business.id },
        data: { userId: targetUserId }
      });
    }

    // Actualizar usuario: nueva contraseña, desbloquear reintentos, incrementar versión de sesión
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: hashedPassword,
        mustChangePassword: Boolean(mustChangePassword),
        failedLoginCount: 0,
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 } // Invalida cualquier sesión previa
      },
      select: {
        id: true,
        email: true,
        name: true,
        mustChangePassword: true,
        lastLoginAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Contraseña reseteada exitosamente",
      password: plainPassword,
      email: updatedUser.email,
      businessName: business.name,
      subdomain: business.subdomain,
      mustChangePassword: updatedUser.mustChangePassword,
    });
  } catch (error) {
    console.error("Error reseteando contraseña desde admin:", error);
    return NextResponse.json({ error: "Error interno al resetear contraseña" }, { status: 500 });
  }
}
