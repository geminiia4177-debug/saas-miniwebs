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
  imageUrl: z.string().max(500).optional().default(""),
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
      const appointments = await prisma.appointment.findMany({
        where: { businessId },
        select: {
          id: true,
          clientName: true,
          clientPhone: true,
          serviceName: true,
          date: true,
          status: true,
        },
        orderBy: { date: "desc" },
        take: 3000,
      });

      const clientMap = new Map<string, {
        id: string;
        name: string;
        phone: string;
        visits: number;
        completedVisits: number;
        cancelledVisits: number;
        lastVisit: string;
        firstVisit: string;
        services: Record<string, number>;
      }>();

      appointments.forEach((appt) => {
        const phone = (appt.clientPhone || "").trim();
        const key = phone || appt.clientName.trim().toLowerCase();
        if (!key) return;

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            id: `client_${key.replace(/[^a-zA-Z0-9]/g, "_")}`,
            name: appt.clientName,
            phone: appt.clientPhone || "",
            visits: 0,
            completedVisits: 0,
            cancelledVisits: 0,
            lastVisit: appt.date.toISOString(),
            firstVisit: appt.date.toISOString(),
            services: {},
          });
        }

        const c = clientMap.get(key)!;
        c.visits += 1;
        if (appt.status === "COMPLETED" || appt.status === "CONFIRMED") {
          c.completedVisits += 1;
        } else if (appt.status === "CANCELLED") {
          c.cancelledVisits += 1;
        }

        if (new Date(appt.date) > new Date(c.lastVisit)) {
          c.lastVisit = appt.date.toISOString();
        }
        if (new Date(appt.date) < new Date(c.firstVisit)) {
          c.firstVisit = appt.date.toISOString();
        }

        if (appt.serviceName) {
          c.services[appt.serviceName] = (c.services[appt.serviceName] || 0) + 1;
        }
      });

      const now = new Date();
      const clientList = Array.from(clientMap.values()).map((c) => {
        let favoriteService = "Sin especificar";
        let maxCount = 0;
        for (const [srv, count] of Object.entries(c.services)) {
          if (count > maxCount) {
            maxCount = count;
            favoriteService = srv;
          }
        }

        const daysSinceLast = Math.max(
          0,
          Math.floor((now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 3600 * 24))
        );

        let status: "VIP" | "ACTIVE" | "INACTIVE" = "ACTIVE";
        if (c.completedVisits >= 3) {
          status = "VIP";
        } else if (daysSinceLast > 45) {
          status = "INACTIVE";
        }

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          visits: c.visits,
          completedVisits: c.completedVisits,
          favoriteService,
          lastVisit: c.lastVisit,
          daysSinceLastVisit: daysSinceLast,
          status,
        };
      });

      // Sort by last visit descending
      clientList.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

      return NextResponse.json(clientList);
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
