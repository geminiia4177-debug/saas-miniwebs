import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessOwner } from "@/lib/auth-helpers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: sessionError } = await requireSession();
    if (sessionError) return sessionError;

    const resolvedParams = await params;
    const tableId = resolvedParams.id;

    if (!tableId) {
      return NextResponse.json({ error: "ID de mesa no proporcionado" }, { status: 400 });
    }

    // Verify table belongs to user's business
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, businessId: true }
    });

    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const { error: authError } = await requireBusinessOwner(table.businessId);
    if (authError) return authError;

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
      const totalNum = typeof order.total === 'number' ? order.total : (order.total as any).toNumber ? (order.total as any).toNumber() : Number(order.total);
      if (orderDate >= startDay) dayTotal += totalNum;
      if (orderDate >= startWeek) weekTotal += totalNum;
      if (orderDate >= startMonth) monthTotal += totalNum;
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
