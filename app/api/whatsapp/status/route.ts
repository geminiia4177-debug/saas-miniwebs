import { NextResponse } from 'next/server';

export async function GET() {
  const globalAny: any = global;
  
  if (!globalAny.waStatus) {
    return NextResponse.json({ status: 'NOT_INITIALIZED' });
  }

  return NextResponse.json({
    status: globalAny.waStatus,
    qrCode: globalAny.waQrCode // This contains the Base64 Data URL if QR is ready
  });
}
