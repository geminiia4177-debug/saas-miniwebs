import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner } from "@/lib/auth-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "sales", "employees", "suppliers"
  const { id } = await params;

  try {
    let businessId: string;
    if (type === "sales") {
      const entity = await prisma.sale.findUnique({ where: { id } });
      if (!entity) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      businessId = entity.businessId;
    } else if (type === "employees") {
      const entity = await prisma.employee.findUnique({ where: { id } });
      if (!entity) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      businessId = entity.businessId;
    } else if (type === "suppliers") {
      const entity = await prisma.supplier.findUnique({ where: { id } });
      if (!entity) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      businessId = entity.businessId;
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    // SEC-009 Fix: Verify ownership before deleting
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    if (type === "sales") {
      await prisma.sale.update({ where: { id }, data: { deletedAt: new Date() } });
    } else if (type === "employees") {
      await prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    } else if (type === "suppliers") {
      await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CRM data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
