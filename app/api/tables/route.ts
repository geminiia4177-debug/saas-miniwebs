import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
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

    const tables = await prisma.table.findMany({
      where: { businessId: business.id },
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } }
        }
      }
    });

    return NextResponse.json(tables);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    // Get max table number
    const lastTable = await prisma.table.findFirst({
      where: { businessId: business.id },
      orderBy: { number: "desc" },
    });

    const newNumber = lastTable ? lastTable.number + 1 : 1;
    
    const tableUrl = business.customDomain ? `https://${business.customDomain}/?mesa=${newNumber}` : `https://${business.subdomain}.saas-miniwebs.vercel.app/?mesa=${newNumber}`;
    // Optionally generate a real QR code image URL here using a free API or a package
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tableUrl)}`;

    const newTable = await prisma.table.create({
      data: {
        businessId: business.id,
        number: newNumber,
        status: "CLOSED",
        qrCodeUrl,
      },
    });

    return NextResponse.json(newTable);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { tableId, status, paymentMethod, cancelOrders } = data;

    if (!tableId || !status) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });

    if (status === "CLOSED") {
      if (cancelOrders) {
        await prisma.order.updateMany({
          where: { tableId, status: { in: ["PENDING", "CONFIRMED"] } },
          data: { status: "CANCELLED" }
        });
      } else {
        await prisma.order.updateMany({
          where: { tableId, status: { in: ["PENDING", "CONFIRMED"] } },
          data: { status: "COMPLETED", paymentMethod: paymentMethod || null }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
