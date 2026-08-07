import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { businessId } = await req.json();

    if (session.user.role === 'USER') {
      const biz = await prisma.business.findMany({ where: { userId: session.user.id }, select: { id: true } });
      const bizIds = biz.map((b: { id: string }) => b.id);
      
      // Mark ADMIN messages as read for this user's businesses
      await prisma.message.updateMany({
        where: { businessId: { in: bizIds }, senderType: 'ADMIN', isRead: false },
        data: { isRead: true }
      });
    } else {
      // ADMIN
      if (businessId) {
        // Mark USER messages as read for this business
        await prisma.message.updateMany({
          where: { businessId, senderType: 'USER', isRead: false },
          data: { isRead: true }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
