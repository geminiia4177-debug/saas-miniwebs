import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessOwner, requireSession } from "@/lib/auth-helpers";
import { z } from "zod";

// ─── INPUT VALIDATION SCHEMAS ─────────────────────────────────────────────────

const SaleCreateSchema = z.object({
  businessId: z.string().min(1),
  type: z.literal("sales"),
  saleType: z.enum(["SERVICE", "PRODUCT"]).default("SERVICE"),
  amount: z.number().positive(),
  description: z.string().max(200).optional().default(""),
  employeeId: z.string().optional().nullable(),
});

const EmployeeCreateSchema = z.object({
  businessId: z.string().min(1),
  type: z.literal("employees"),
  name: z.string().min(1).max(100),
  role: z.string().max(100).optional().default(""),
  salaryType: z.enum(["FIXED", "PERCENTAGE", "HOURLY"]).optional().default("FIXED"),
  salaryValue: z.number().min(0).optional().default(0),
  imageUrl: z.string().url().max(500).optional().default(""),
  bio: z.string().max(500).optional().default(""),
  isPublic: z.boolean().optional().default(true),
});

const SupplierCreateSchema = z.object({
  businessId: z.string().min(1),
  type: z.literal("suppliers"),
  name: z.string().min(1).max(100),
  phone: z.string().max(30).optional().nullable(),
  products: z.string().max(500).optional().nullable(),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let businessId = searchParams.get("businessId");
  const type = searchParams.get("type"); // "sales", "employees", "suppliers", "clients"
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { session, error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

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

  // P1-021: Require business ownership for all CRM reads
  const { error: authError } = await requireBusinessOwner(businessId);
  if (authError) return authError;

  try {
    if (type === "clients") {
      // Placeholder — clients table not yet in schema
      return NextResponse.json([]);
    }

    if (type === "sales") {
      const sales = await prisma.sale.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { date: "desc" },
        take: 200,
        skip: offset,
      });
      return NextResponse.json(sales);
    }

    if (type === "employees") {
      const employees = await prisma.employee.findMany({
        where: { businessId, deletedAt: null },
        take: 200,
      });
      return NextResponse.json(employees);
    }

    if (type === "suppliers") {
      const suppliers = await prisma.supplier.findMany({
        where: { businessId, deletedAt: null },
        take: 200,
      });
      return NextResponse.json(suppliers);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching CRM data:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// P0-003 / P1-021 FIX: Replace weak email-based ownership check with requireBusinessOwner.
// requireBusinessOwner verifies userId against the DB record, not the session email string.

export async function POST(request: Request) {
  const { error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

  try {
    const rawData = await request.json();
    const { businessId, type } = rawData;

    if (!businessId || !type) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // P0-003: Verify ownership using requireBusinessOwner (DB-verified, not email-based)
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    if (type === "sales") {
      const parsed = SaleCreateSchema.safeParse(rawData);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 });
      }
      const { saleType, amount, description, employeeId } = parsed.data;
      const sale = await prisma.sale.create({
        data: {
          businessId,
          type: saleType,
          amount,
          itemName: description,
          employeeId: employeeId || null,
        },
      });
      return NextResponse.json(sale);
    }

    if (type === "employees") {
      const parsed = EmployeeCreateSchema.safeParse(rawData);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 });
      }
      const { name, role, salaryType, salaryValue, imageUrl, bio, isPublic } = parsed.data;
      const employee = await prisma.employee.create({
        data: { businessId, name, role, salaryType, salaryValue, imageUrl, bio, isPublic },
      });
      return NextResponse.json(employee);
    }

    if (type === "suppliers") {
      const parsed = SupplierCreateSchema.safeParse(rawData);
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 });
      }
      const { name, phone, products } = parsed.data;
      const supplier = await prisma.supplier.create({
        data: { businessId, name, phone: phone ?? null, products: products ?? null },
      });
      return NextResponse.json(supplier);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error creating CRM data:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  const { error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

  try {
    const data = await request.json();
    const { id, type } = data;

    if (!id || !type) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (type === "employees") {
      // P1-021: Resolve employee → businessId → check ownership
      const existingEmployee = await prisma.employee.findUnique({ where: { id } });
      if (!existingEmployee) {
        return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
      }

      const { error: authError } = await requireBusinessOwner(existingEmployee.businessId);
      if (authError) return authError;

      const payload = data;

      if (payload.addServicesDone !== undefined) {
        const emp = await prisma.employee.update({
          where: { id },
          data: { servicesDone: { increment: parseInt(payload.addServicesDone) } },
        });
        return NextResponse.json(emp);
      }

      if (payload.addHoursWorked !== undefined) {
        const emp = await prisma.employee.update({
          where: { id },
          data: { hoursWorked: { increment: parseFloat(payload.addHoursWorked) } },
        });
        return NextResponse.json(emp);
      }

      // Normal update — whitelist fields
      const employee = await prisma.employee.update({
        where: { id },
        data: {
          ...(payload.name !== undefined && { name: String(payload.name).substring(0, 100) }),
          ...(payload.role !== undefined && { role: String(payload.role).substring(0, 100) }),
          ...(payload.salaryType !== undefined && { salaryType: payload.salaryType }),
          ...(payload.salaryValue !== undefined && { salaryValue: parseFloat(payload.salaryValue) }),
          ...(payload.imageUrl !== undefined && { imageUrl: payload.imageUrl }),
          ...(payload.bio !== undefined && { bio: String(payload.bio).substring(0, 500) }),
          ...(payload.isPublic !== undefined && { isPublic: Boolean(payload.isPublic) }),
          ...(payload.servicesDone !== undefined && { servicesDone: parseInt(payload.servicesDone) }),
          ...(payload.hoursWorked !== undefined && { hoursWorked: parseFloat(payload.hoursWorked) }),
        },
      });
      return NextResponse.json(employee);
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error updating CRM data:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
