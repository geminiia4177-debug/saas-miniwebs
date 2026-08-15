import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toSafeBusinessDTO } from "@/lib/dtos";
import { ownerBusinessUpdateSchema, adminBusinessUpdateSchema } from "@/lib/validations";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { encryptSecret } from "@/lib/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// P1-030: Clean and validate custom domain hostname
function cleanCustomDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Strip protocol, trailing slash, whitespace
  const cleaned = raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "") // remove any path component
    .trim();
  // Reject anything that looks like a javascript: URL or has special chars
  if (!cleaned || !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(cleaned)) return null;
  return cleaned;
}

const parseDate = (d: any): Date | null => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

// ─── GET: Fetch a single business ─────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Only select safe fields — never fetch callMeBotApiKey, bankDetails at this stage
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        logoUrl: true,
        bannerUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        type: true,
        status: true,
        description: true,
        email: true,
        phone: true,
        timezone: true,
        layoutConfig: true,
        publishedConfig: true,
        callMeBotApiKey: true, // Needed only to compute hasCallMeBotApiKey boolean
        bankDetails: true,     // Needed only to compute hasBankDetails boolean
        paymentAmount: true,
        paymentStatus: true,
        demoExpiresAt: true,
        nextPayment: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const isOwnerOrAdmin =
      session?.user &&
      (session.user.role === "ADMIN" ||
        session.user.id === business.userId);

    if (!isOwnerOrAdmin && business.layoutConfig) {
      // P0-001: Public users get a filtered layoutConfig (no internal keys)
      const original =
        typeof business.layoutConfig === "object" && business.layoutConfig !== null
          ? (business.layoutConfig as any)
          : {};

      // Whitelist of fields safe for public consumption
      business.layoutConfig = {
        hours: original.hours,
        menuCategorias: original.menuCategorias,
        menuPromos: original.menuPromos,
        barberiaServices: original.barberiaServices,
        clinicaServices: original.clinicaServices,
        tallerServices: original.tallerServices,
        canchaTarifas: original.canchaTarifas,
        instagram: original.instagram,
        facebook: original.facebook,
        whatsapp: original.whatsapp,
        tiktok: original.tiktok,
        modosDisponibles: original.modosDisponibles,
        deliveryRadio: original.deliveryRadio,
        reservaMesaActiva: original.reservaMesaActiva,
        bannerOpacity: original.bannerOpacity,
        sections: original.sections,
        themeVariant: original.themeVariant,
        media: original.media,
        address: original.address,
      };
    }

    // P0-001: toSafeBusinessDTO strips callMeBotApiKey & bankDetails,
    // returns hasCallMeBotApiKey and hasBankDetails booleans only.
    return NextResponse.json(toSafeBusinessDTO(business, isOwnerOrAdmin ?? false));
  } catch (error) {
    console.error("Error obteniendo negocio:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al obtener" }, { status: 500 });
  }
}

// ─── PUT: Update a business ───────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // requireBusinessOwner verifies session + DB ownership
    const { session, error: authError, business: existingBusiness } =
      await requireBusinessOwner(id);
    if (authError) return authError;
    if (!existingBusiness) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    
    // P1-021: Enforce payload size limits (1MB global)
    const rawText = await req.text();
    if (rawText.length > 1_048_576) { // 1MB
      return NextResponse.json({ error: "El payload excede el límite máximo permitido (1MB)." }, { status: 413 });
    }
    
    let rawData;
    try {
      rawData = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    // P1-021: Limit layoutConfig specifically to 10KB
    if (rawData.layoutConfig && JSON.stringify(rawData.layoutConfig).length > 10_240) {
      return NextResponse.json({ error: "La configuración visual excede el límite permitido (10KB)." }, { status: 413 });
    }

    const schema = isAdmin ? adminBusinessUpdateSchema : ownerBusinessUpdateSchema;
    const parseResult = schema.safeParse(rawData);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const data = parseResult.data as any;

    // P1-030: Banned subdomains
    if (data.subdomain) {
      const banned = [
        "admin", "api", "dashboard", "auth", "support",
        "miniwebs", "app", "www", "static", "_next",
      ];
      if (banned.includes(data.subdomain.toLowerCase())) {
        return NextResponse.json(
          { error: "Este subdominio está reservado y no puede utilizarse." },
          { status: 400 }
        );
      }
    }

    // P1-030: Clean and validate customDomain
    const resolvedCustomDomain =
      data.customDomain !== undefined
        ? cleanCustomDomain(data.customDomain)
        : undefined;

    // Build layoutConfig: merge with social links from top-level fields
    let newLayoutConfig: any = undefined;
    if (data.layoutConfig !== undefined || data.instagram !== undefined || data.facebook !== undefined) {
      newLayoutConfig = {
        ...(data.layoutConfig || {}),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.tiktok !== undefined && { tiktok: data.tiktok }),
      };
    }

    // Build update payload — only include fields that were explicitly provided
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (resolvedCustomDomain !== undefined) updateData.customDomain = resolvedCustomDomain;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;
    if (data.fontFamily !== undefined) updateData.fontFamily = data.fontFamily;
    if (newLayoutConfig !== undefined) updateData.layoutConfig = newLayoutConfig;

    // Admin-only fields
    if (isAdmin) {
      if (data.status !== undefined) updateData.status = data.status;
      if (data.paymentAmount !== undefined) updateData.paymentAmount = Number(data.paymentAmount) || 0;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.demoExpiresAt !== undefined) updateData.demoExpiresAt = parseDate(data.demoExpiresAt);
      if (data.nextPayment !== undefined) updateData.nextPayment = parseDate(data.nextPayment);
      if (data.paymentData !== undefined) updateData.paymentData = data.paymentData;
    }

    // Encrypted secrets — encrypt before storing, never return decrypted
    if (data.callMeBotApiKey !== undefined) {
      updateData.callMeBotApiKey = encryptSecret(data.callMeBotApiKey);
    }
    if (data.bankDetails !== undefined) {
      updateData.bankDetails = encryptSecret(data.bankDetails);
    }

    // Publish config if requested
    if (rawData.publish === true && newLayoutConfig) {
      updateData.publishedConfig = newLayoutConfig;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: updateData,
    });

    // P0-001: toSafeBusinessDTO never returns decrypted secrets
    return NextResponse.json(toSafeBusinessDTO(updatedBusiness, true));
  } catch (error) {
    console.error("Error editando negocio:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ─── DELETE: Soft-archive a business ─────────────────────────────────────────
// P1-026: Physical DELETE is not allowed. Archive via status change only.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Only ADMINs can archive a business via this endpoint
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Para archivar tu negocio, por favor contacta a soporte." },
        { status: 403 }
      );
    }

    // Verify ownership/admin access
    const { error: authError } = await requireBusinessOwner(id);
    if (authError) return authError;

    await prisma.business.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archivando negocio:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al archivar" }, { status: 500 });
  }
}