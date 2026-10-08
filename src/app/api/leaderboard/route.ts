import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const top = await prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      role: true,
      points: true,
      _count: { select: { signups: { where: { status: 'ATTENDED' } } } },
    },
  });
  return NextResponse.json(
    top.map((u) => ({ id: u.id, name: u.name, role: u.role, points: u.points, attended: u._count.signups })),
  );
}
