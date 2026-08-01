import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tableId = resolvedParams.id;

    if (!tableId) {
      return NextResponse.json({ error: "ID de mesa no proporcionado" }, { status: 400 });
    }

    // Verify table belongs to user's business
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { business: { include: { user: true } } }
    });

    if (!table || table.business.user?.email !== session.user.email) {
      return NextResponse.json({ error: "No autorizado o mesa no encontrada" }, { status: 403 });
    }

    const now = new Date();
    
    // We can do this without date-fns to avoid extra dependencies if it's not installed.
    // However, it's a common library. Let's do it with native JS just in case.
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await prisma.order.findMany({
      where: {
        tableId: tableId,
        status: "COMPLETED",
      },
      select: {
        total: true,
        createdAt: true,
      }
    });

    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startDay) dayTotal += order.total;
      if (orderDate >= startWeek) weekTotal += order.total;
      if (orderDate >= startMonth) monthTotal += order.total;
    });

    return NextResponse.json({
      day: dayTotal,
      week: weekTotal,
      month: monthTotal
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
