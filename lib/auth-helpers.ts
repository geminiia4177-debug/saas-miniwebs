import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { error, session: null };
  
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Prohibido: Requiere rol ADMIN" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireBusinessOwner(businessId: string) {
  const { session, error } = await requireSession();
  if (error) return { error, session: null };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { userId: true }
  });

  if (!business) {
    return { error: NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 }), session: null, business: null };
  }

  const isAdmin = session.user.role === 'ADMIN';
  if (business.userId !== session.user.id && !isAdmin) {
    return { error: NextResponse.json({ error: "Prohibido: No tienes permiso para acceder a este negocio" }, { status: 403 }), session: null, business: null };
  }

  return { error: null, session, business };
}
