import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", message: "Database connected", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Database health check failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
