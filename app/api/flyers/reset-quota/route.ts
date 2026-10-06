import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ResetQuotaSchema = z.object({
  businessId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parse = ResetQuotaSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const { businessId } = parse.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (business.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const layout = (business.layoutConfig as any) || {};
    const usage = layout.flyersUsage || {};

    // Resetear el cupo eliminando nextAvailableAt
    const updatedLayout = {
      ...layout,
      flyersUsage: {
        ...usage,
        nextAvailableAt: null,
      },
    };

    await prisma.business.update({
      where: { id: business.id },
      data: { layoutConfig: updatedLayout },
    });

    return NextResponse.json({
      success: true,
      message: "Cupo de flyers reseteado con éxito. Ahora puedes generar nuevos flyers inmediatamente.",
    });
  } catch (error: any) {
    console.error("Reset quota error:", error);
    return NextResponse.json({ error: "Error al resetear cupo", details: error?.message }, { status: 500 });
  }
}
