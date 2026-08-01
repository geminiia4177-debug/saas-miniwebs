import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content, type } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    // Deactivate previous alerts to keep only 1 active globally
    await prisma.alert.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const alert = await prisma.alert.create({
      data: {
        content,
        type: type || "info",
        isActive: true
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.alert.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      await prisma.alert.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
