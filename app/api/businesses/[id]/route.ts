import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
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

    // P0-006: Non-owners/visitors only receive PublicBusinessDTO (never draft layoutConfig, userId, paymentData, etc.)
    if (!isOwnerOrAdmin) {
      if (business.status === "BLOCKED" || business.status === "ARCHIVED") {
        return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
      }

      return NextResponse.json({
        id: business.id,
        name: business.name,
        subdomain: business.subdomain,
        customDomain: business.customDomain,
        logoUrl: business.logoUrl,
        bannerUrl: business.bannerUrl,
        primaryColor: business.primaryColor,
        secondaryColor: business.secondaryColor,
        accentColor: business.accentColor,
        fontFamily: business.fontFamily,
        type: business.type,
        status: business.status,
        description: business.description,
        timezone: business.timezone,
        publishedConfig: business.publishedConfig,
      });
    }

    // Authenticated owner/admin receives full safe business DTO
    return NextResponse.json(toSafeBusinessDTO(business, true));
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

    // P1-021: Limit layoutConfig specifically to 500KB
    if (rawData.layoutConfig && JSON.stringify(rawData.layoutConfig).length > 500_000) {
      return NextResponse.json({ error: "La configuración visual excede el límite permitido (500KB)." }, { status: 413 });
    }

    const schema = isAdmin ? adminBusinessUpdateSchema : ownerBusinessUpdateSchema;
    const parseResult = schema.safeParse(rawData);

    if (!parseResult.success) {
      console.error("ZOD PARSE ERROR", JSON.stringify(parseResult.error.format(), null, 2));
      return NextResponse.json(
        { error: "Datos inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const data = parseResult.data;

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

    // P1-003: Clean and validate customDomain
    const resolvedCustomDomain =
      data.customDomain !== undefined
        ? cleanCustomDomain(data.customDomain)
        : undefined;

    // Build layoutConfig: merge with social links and UI fields from top-level
    let newLayoutConfig: Record<string, unknown> | undefined = undefined;
    if (data.layoutConfig !== undefined || data.instagram !== undefined || data.facebook !== undefined || data.buttonStyle !== undefined || data.backgroundType !== undefined || data.backgroundImageUrl !== undefined) {
      newLayoutConfig = {
        ...((data.layoutConfig as Record<string, unknown>) || {}),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.tiktok !== undefined && { tiktok: data.tiktok }),
        ...(data.buttonStyle !== undefined && { buttonStyle: data.buttonStyle }),
        ...(data.backgroundType !== undefined && { backgroundType: data.backgroundType }),
        ...(data.backgroundImageUrl !== undefined && { backgroundImageUrl: data.backgroundImageUrl }),
      };
    }

    // Build update payload — only include fields that were explicitly provided
    const updateData: Prisma.BusinessUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (resolvedCustomDomain !== undefined) {
      updateData.customDomain = resolvedCustomDomain;
      if (!isAdmin && resolvedCustomDomain !== existingBusiness.customDomain) {
        updateData.domainVerifiedAt = null; // Invalidate verification on change
      }
    }
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
    if (newLayoutConfig !== undefined) updateData.layoutConfig = newLayoutConfig as object;

    // Admin-only fields
    if (isAdmin) {
      const adminData = data as z.infer<typeof adminBusinessUpdateSchema>;
      if (adminData.status !== undefined) updateData.status = adminData.status;
      if (adminData.paymentAmount !== undefined) updateData.paymentAmount = Number(adminData.paymentAmount) || 0;
      if (adminData.paymentStatus !== undefined) updateData.paymentStatus = adminData.paymentStatus;
      if (adminData.demoExpiresAt !== undefined) updateData.demoExpiresAt = parseDate(adminData.demoExpiresAt);
      if (adminData.nextPayment !== undefined) updateData.nextPayment = parseDate(adminData.nextPayment);
      if (adminData.paymentData !== undefined) updateData.paymentData = adminData.paymentData as object;
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
      updateData.publishedConfig = newLayoutConfig as object;
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
    const data = await req.json();
    
    const parsed = ownerBusinessUpdateSchema.safeParse(data);
    if (!parsed.success) {
      console.error("ZOD ERROR ON UPDATE:", JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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