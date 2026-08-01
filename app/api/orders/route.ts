import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { businessId, tableId, type, items, total, address, customerName, customerPhone } = data;

    if (!businessId || !items) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Determine Table ID if mesaNum was passed
    let actualTableId = null;
    if (type === "MESA" && tableId) {
      // Find table by number and businessId
      const table = await prisma.table.findFirst({
        where: { businessId, number: parseInt(tableId) }
      });
      if (table) {
        actualTableId = table.id;
        // Optionally mark table as OPEN if it was closed
        if (table.status === "CLOSED") {
          await prisma.table.update({ where: { id: table.id }, data: { status: "OPEN" } });
        }
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        businessId,
        tableId: actualTableId,
        type,
        status: "PENDING",
        items,
        total,
        address,
        customerName,
        customerPhone,
      },
    });

    return NextResponse.json(newOrder);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    // If businessId is provided in URL, it's public access via token
    // (In a real app, validate a secure token parameter)
    if (businessId) {
      const token = searchParams.get("token");
      // Add simple validation if needed, or rely on obscure URLs
      const orders = await prisma.order.findMany({
        where: { businessId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: { table: true }
      });
      return NextResponse.json(orders);
    }

    // Otherwise, require authentication (for Dashboard use)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: { table: true }
    });

    return NextResponse.json(orders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    // Both employee links and dashboard can update orders
    const data = await req.json();
    const { orderId, status } = data;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // If completed and tied to a table, we could check if table should be closed
    // But usually you close the table manually or when paying.

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
