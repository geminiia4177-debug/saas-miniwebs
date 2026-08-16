import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessOwner } from "@/lib/auth-helpers";
import { z } from "zod";

const TableStatusSchema = z.enum(["OPEN", "CLOSED"]);

export async function GET(req: Request) {
  try {
    const { session, error: sessionError } = await requireSession();
    if (sessionError) return sessionError;

    const { searchParams } = new URL(req.url);
    let businessId = searchParams.get("businessId");

    if (!businessId) {
      const business = await prisma.business.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!business) {
        return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
      }
      businessId = business.id;
    }

    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    const tables = await prisma.table.findMany({
      where: { businessId },
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } }
        }
      }
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { session, error: sessionError } = await requireSession();
    if (sessionError) return sessionError;

    const body = await req.json().catch(() => ({}));
    let businessId = body.businessId;

    if (!businessId) {
      const business = await prisma.business.findFirst({
        where: { userId: session.user.id },
        select: { id: true, customDomain: true, subdomain: true },
      });
      if (!business) {
        return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
      }
      businessId = business.id;
    }

    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, customDomain: true, subdomain: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Assign next available table number in a concurrency-safe loop/transaction
    let newTable = null;
    let attempts = 0;

    while (!newTable && attempts < 3) {
      attempts++;
      try {
        newTable = await prisma.$transaction(async (tx) => {
          const lastTable = await tx.table.findFirst({
            where: { businessId: business.id },
            orderBy: { number: "desc" },
          });

          const newNumber = lastTable ? lastTable.number + 1 : 1;
          const tableUrl = business.customDomain ? `https://${business.customDomain}/?mesa=${newNumber}` : `https://${business.subdomain}.saas-miniwebs.com/?mesa=${newNumber}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tableUrl)}`;

          return await tx.table.create({
            data: {
              businessId: business.id,
              number: newNumber,
              status: "CLOSED",
              qrCodeUrl,
            },
          });
        });
      } catch (err: unknown) {
        const errObj = err as { code?: string };
        if (errObj.code === "P2002" && attempts < 3) {
          continue;
        }
        throw err;
      }
    }

    if (!newTable) {
      return NextResponse.json({ error: "Error de concurrencia al crear la mesa" }, { status: 409 });
    }

    return NextResponse.json(newTable);
  } catch (error) {
    console.error("Error creating table:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { error: sessionError } = await requireSession();
    if (sessionError) return sessionError;

    const data = await req.json();
    const { tableId, status, paymentMethod, cancelOrders } = data;

    if (!tableId || !status) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const statusParsed = TableStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      return NextResponse.json({ error: "Estado de mesa inválido (debe ser OPEN o CLOSED)" }, { status: 400 });
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const { error: authError } = await requireBusinessOwner(table.businessId);
    if (authError) return authError;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: statusParsed.data }
      });

      if (statusParsed.data === "CLOSED") {
        if (cancelOrders) {
          await tx.order.updateMany({
            where: { tableId, status: { in: ["PENDING", "CONFIRMED"] } },
            data: { status: "CANCELLED" }
          });
        } else {
          await tx.order.updateMany({
            where: { tableId, status: { in: ["PENDING", "CONFIRMED"] } },
            data: { status: "COMPLETED", paymentMethod: paymentMethod || null }
          });
        }
      }
      return updatedTable;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating table:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
