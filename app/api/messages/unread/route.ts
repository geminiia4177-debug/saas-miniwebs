import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let count = 0;
    if (session.user.role === 'USER') {
      const biz = await prisma.business.findMany({ where: { userId: session.user.id }, select: { id: true } });
      const bizIds = biz.map((b: { id: string }) => b.id);
      count = await prisma.message.count({
        where: { businessId: { in: bizIds }, senderType: { in: ['ADMIN', 'AI'] }, isRead: false }
      });
    } else {
      count = await prisma.message.count({
        where: { senderType: 'USER', isRead: false }
      });
    }
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
