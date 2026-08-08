import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const globalAny: any = global;
  
  if (!globalAny.waStatus) {
    return NextResponse.json({ status: 'NOT_INITIALIZED' });
  }

  return NextResponse.json({
    status: globalAny.waStatus,
    qrCode: globalAny.waQrCode // This contains the Base64 Data URL if QR is ready
  });
}
