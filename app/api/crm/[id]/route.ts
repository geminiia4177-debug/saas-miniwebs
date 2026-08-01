import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    if (type === "sales") {
      await (prisma as any).sale.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    
    if (type === "employees") {
      await (prisma as any).employee.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    
    if (type === "suppliers") {
      await (prisma as any).supplier.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting CRM data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
