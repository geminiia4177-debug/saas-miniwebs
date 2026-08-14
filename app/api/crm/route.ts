import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner, requireSession } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let businessId = searchParams.get("businessId");
  const type = searchParams.get("type"); // "sales", "employees", "suppliers", "clients"
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { session, error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

  if (!businessId) {
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;
  }

  // SEC-007 Fix: Require business ownership
  const { error: authError } = await requireBusinessOwner(businessId);
  if (authError) return authError;

  try {
    if (type === "clients") {
      // TODO: Implement clients table in schema
      return NextResponse.json([]);
    }

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      });
      return NextResponse.json(sales);
    }
    
    if (type === "employees") {
      const employees = await prisma.employee.findMany({
        where: { businessId, deletedAt: null }
      });
      return NextResponse.json(employees);
    }
    
    if (type === "suppliers") {
      const suppliers = await prisma.supplier.findMany({
        where: { businessId, deletedAt: null }
      });
      return NextResponse.json(suppliers);
    }
    
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching CRM data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { businessId, type, ...payload } = data;

    if (!businessId || !type) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Security check: ensure user owns this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true }
    });

    if (!business || business.user?.email !== session.user?.email) {
      return NextResponse.json({ error: "No autorizado para este negocio" }, { status: 403 });
    }

    if (type === "sales") {
      const sale = await (prisma as any).sale.create({
        data: {
          businessId,
          type: payload.saleType || "SERVICE",
          amount: parseFloat(payload.amount),
          itemName: payload.description || "",
          employeeId: payload.employeeId || null,
        }
      });
      return NextResponse.json(sale);
    }
    
    if (type === "employees") {
      const employee = await (prisma as any).employee.create({
        data: {
          businessId,
          name: payload.name,
          role: payload.role || "",
          salaryType: payload.salaryType || "FIXED",
          salaryValue: parseFloat(payload.salaryValue || 0),
          imageUrl: payload.imageUrl || "",
          bio: payload.bio || "",
          isPublic: payload.isPublic ?? true,
        }
      });
      return NextResponse.json(employee);
    }
    
    if (type === "suppliers") {
      const supplier = await (prisma as any).supplier.create({
        data: {
          businessId,
          name: payload.name,
          phone: payload.phone,
          products: payload.products,
        }
      });
      return NextResponse.json(supplier);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error creating CRM data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, type, ...payload } = data;

    if (!id || !type) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (type === "employees") {
      // SEC-008 Fix: Resolve employee -> businessId -> check ownership
      const existingEmployee = await (prisma as any).employee.findUnique({ where: { id } });
      if (!existingEmployee) {
        return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
      }

      const { error: authError } = await requireBusinessOwner(existingEmployee.businessId);
      if (authError) return authError;
      // If we are passing addServicesDone or addHoursWorked, we increment
      if (payload.addServicesDone !== undefined) {
        const emp = await (prisma as any).employee.update({
          where: { id },
          data: {
            servicesDone: { increment: parseInt(payload.addServicesDone) }
          }
        });
        return NextResponse.json(emp);
      }
      
      if (payload.addHoursWorked !== undefined) {
        const emp = await (prisma as any).employee.update({
          where: { id },
          data: {
            hoursWorked: { increment: parseFloat(payload.addHoursWorked) }
          }
        });
        return NextResponse.json(emp);
      }

      // Normal update
      const employee = await (prisma as any).employee.update({
        where: { id },
        data: {
          name: payload.name,
          role: payload.role,
          salaryType: payload.salaryType,
          salaryValue: payload.salaryValue !== undefined ? parseFloat(payload.salaryValue) : undefined,
          imageUrl: payload.imageUrl,
          bio: payload.bio,
          isPublic: payload.isPublic,
          servicesDone: payload.servicesDone !== undefined ? parseInt(payload.servicesDone) : undefined,
          hoursWorked: payload.hoursWorked !== undefined ? parseFloat(payload.hoursWorked) : undefined,
        }
      });
      return NextResponse.json(employee);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error updating CRM data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
