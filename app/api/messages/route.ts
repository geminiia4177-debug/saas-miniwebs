import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  try {
    let whereClause: any = {};
    if (session.user.role === "USER") {
      // User can only see messages for their businesses
      const biz = await prisma.business.findMany({ where: { userId: session.user.id }, select: { id: true } });
      const bizIds = biz.map(b => b.id);
      whereClause = { businessId: { in: bizIds } };
    } else {
      // ADMIN
      if (businessId) {
        whereClause = { businessId };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        business: { select: { name: true, subdomain: true } }
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { businessId, content } = await req.json();

    if (!businessId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const senderType = session.user.role === "ADMIN" ? "ADMIN" : "USER";

    const msg = await prisma.message.create({
      data: {
        businessId,
        content,
        senderType,
        isRead: false
      },
      include: {
        business: { select: { name: true } }
      }
    });

    return NextResponse.json(msg);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
