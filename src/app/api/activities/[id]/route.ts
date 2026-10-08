import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Context = { params: { id: string } };

export async function GET(_req: Request, { params }: Context) {
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: {
      signups: {
        where: { status: 'SIGNED' },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!activity) {
    return NextResponse.json({ error: '活动不存在' }, { status: 404 });
  }
  return NextResponse.json({ ...activity, signed: activity.signups.length });
}
