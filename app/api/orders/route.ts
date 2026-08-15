import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessOwner } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { z } from "zod";

// ─── RATE LIMITING ─────────────────────────────────────────────────────────────
const ORDERS_RATE_WINDOW_MS = 60_000; // 1 minute
const ORDERS_RATE_MAX_IP = 10;
const ORDERS_RATE_MAX_BUSINESS = 50;

// ─── INPUT VALIDATION ─────────────────────────────────────────────────────────
// P1-019: Enforce quantity limits
// P1-020: Enforce string length limits
const OrderItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  quantity: z.number().int().min(1, "La cantidad mínima es 1").max(100, "La cantidad máxima es 100").optional(),
  qty: z.number().int().min(1).max(100).optional(),
  // These fields from the client are ignored for price/name — server resolves them
  nombre: z.string().max(200).optional(),
  precio: z.number().optional(),
  name: z.string().max(200).optional(),
  price: z.number().optional(),
});

const OrderCreateSchema = z.object({
  businessId: z.string().min(1),
  tableId: z.string().optional().nullable(),
  type: z.enum(["TAKEAWAY", "DELIVERY", "LOCAL", "MESA"]).default("TAKEAWAY"),
  items: z.array(OrderItemSchema).min(1, "El pedido debe tener al menos un ítem").max(50, "Demasiados ítems"),
  // P1-018: The 'total' field from the client is only used for desync detection.
  // The actual persisted total is ALWAYS server-calculated.
  total: z.number().min(0).optional(),
  // P1-020: Length limits for customer fields
  customerName: z.string().max(100).optional().nullable(),
  customerPhone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const OrderStatusEnum = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

// ─── POST: CREATE ORDER ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await req.json();
    const { businessId } = body;

    // P1-003 / Orders: Rate limit by IP
    const ipKey = `orders:ip:${ip}`;
    if (!checkRateLimit(ipKey, ORDERS_RATE_MAX_IP, ORDERS_RATE_WINDOW_MS)) {
      const retryAfter = Math.ceil(getRateLimitRetryAfterMs(ipKey, ORDERS_RATE_WINDOW_MS) / 1000);
      return NextResponse.json(
        { error: "Demasiados pedidos desde esta IP. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Rate limit by business (to protect each business's notification system)
    if (businessId) {
      const bizKey = `orders:biz:${businessId}`;
      if (!checkRateLimit(bizKey, ORDERS_RATE_MAX_BUSINESS, ORDERS_RATE_WINDOW_MS)) {
        return NextResponse.json(
          { error: "Este negocio está recibiendo demasiados pedidos. Intenta en un momento." },
          { status: 429 }
        );
      }
    }

    // Validate input
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de pedido inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Verify business exists and is not blocked
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { layoutConfig: true, status: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    if (business.status === "BLOCKED") {
      return NextResponse.json({ error: "Negocio bloqueado" }, { status: 403 });
    }
    if (business.status === "ARCHIVED") {
      return NextResponse.json({ error: "Este negocio no está disponible." }, { status: 403 });
    }

    // P1-018: Build server-authoritative product catalog
    const layoutConfig: any = business.layoutConfig || {};
    const validProducts = new Map<string, { nombre: string; precio: number }>();

    if (Array.isArray(layoutConfig.menuCategorias)) {
      layoutConfig.menuCategorias.forEach((cat: any) => {
        if (Array.isArray(cat.products)) {
          cat.products.forEach((p: any) => {
            if (p.id) {
              validProducts.set(String(p.id), {
                nombre: p.nombre || p.name || "Producto",
                precio: Number(p.precio || p.price || 0),
              });
            }
          });
        }
      });
    }

    if (Array.isArray(layoutConfig.menuPromos)) {
      layoutConfig.menuPromos.forEach((p: any) => {
        if (p.id) {
          validProducts.set(String(p.id), {
            nombre: p.name || "Promo",
            precio: Number(p.price || 0),
          });
        }
      });
    }

    // P1-018: Calculate total server-side — NEVER use client-submitted total
    let calculatedTotal = 0;
    const finalItems = [];

    for (const item of data.items) {
      // P1-019: Use validated quantity
      const quantity = item.quantity ?? item.qty ?? 0;
      if (quantity <= 0) {
        return NextResponse.json({ error: "Cantidades inválidas" }, { status: 400 });
      }

      const validProduct = validProducts.get(item.id);
      if (!validProduct) {
        return NextResponse.json(
          { error: `Producto no encontrado o no disponible` },
          { status: 400 }
        );
      }

      calculatedTotal += validProduct.precio * quantity;

      finalItems.push({
        id: item.id,
        nombre: validProduct.nombre, // Always use server name
        qty: quantity,
        precio: validProduct.precio, // Always use server price
      });
    }

    // P1-018: If client submitted a total, use it only for desync detection, not for storage
    if (data.total !== undefined && Math.abs(calculatedTotal - data.total) > 0.01) {
      return NextResponse.json(
        { error: "El precio de algunos productos ha cambiado. Refresca la página e intenta nuevamente." },
        { status: 400 }
      );
    }

    // Resolve table if applicable
    let actualTableId: string | null = null;
    if (data.type === "MESA" && data.tableId) {
      const table = await prisma.table.findFirst({
        where: { businessId: data.businessId, number: parseInt(data.tableId) },
        select: { id: true, status: true },
      });
      if (table) {
        actualTableId = table.id;
        if (table.status === "CLOSED") {
          await prisma.table.update({ where: { id: table.id }, data: { status: "OPEN" } });
        }
      }
    }

    // P1-018: Always store the SERVER-CALCULATED total
    const newOrder = await prisma.order.create({
      data: {
        businessId: data.businessId,
        tableId: actualTableId,
        type: data.type === "MESA" ? "LOCAL" : data.type,
        status: "PENDING",
        items: finalItems,
        total: calculatedTotal, // <-- server-calculated, never client-submitted
        address: data.address || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
      },
    });

    // Return only safe fields (no internal DB details)
    return NextResponse.json({
      id: newOrder.id,
      status: newOrder.status,
      total: Number(newOrder.total),
      type: newOrder.type,
      items: finalItems,
      createdAt: newOrder.createdAt,
    });
  } catch (error: any) {
    console.error("Error creating order:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 });
  }
}

// ─── GET: LIST ORDERS ─────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let businessId = searchParams.get("businessId");

    // Authentication required
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

    // Ensure the logged-in user owns this business
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const orders = await prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { table: true },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── PATCH: UPDATE ORDER STATUS ───────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { orderId, status } = data;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Validate status value
    const statusParsed = OrderStatusEnum.safeParse(status);
    if (!statusParsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Resolve order → business → check ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { businessId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const { error: authError } = await requireBusinessOwner(order.businessId);
    if (authError) return authError;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: statusParsed.data },
      select: { id: true, status: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
