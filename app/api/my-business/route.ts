import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toSafeUserDTO, toSafeBusinessDTO } from "@/lib/dtos";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. El patovica revisa quién entró
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Buscamos al usuario en la base de datos por su email
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 3. Buscamos UN SOLO negocio que le pertenezca a este usuario
    const myBusiness = await prisma.business.findFirst({
      where: { userId: currentUser.id }
    });

    // 4. Se lo entregamos a la pantalla
    const safeUser = toSafeUserDTO(currentUser);
    const safeBusiness = myBusiness ? toSafeBusinessDTO(myBusiness) : null;
    return NextResponse.json({ business: safeBusiness, user: safeUser });
  } catch (error) {
    console.error("Error cargando el dashboard:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}