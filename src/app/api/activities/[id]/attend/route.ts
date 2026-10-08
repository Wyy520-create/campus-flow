import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Context = { params: { id: string } };

const schema = z.object({ userId: z.string().min(1, '缺少 userId') });

export async function POST(req: NextRequest, { params }: Context) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  if (me.role !== 'ADMIN') return NextResponse.json({ error: '仅管理员可确认到场' }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const signup = await tx.signup.findUnique({
      where: { userId_activityId: { userId: parsed.data.userId, activityId: params.id } },
      include: { activity: true },
    });
    if (!signup || signup.status === 'CANCELLED') {
      return { ok: false as const, reason: '该用户未报名此活动' };
    }
    if (signup.status === 'ATTENDED') {
      return { ok: true as const, points: signup.userId };
    }
    await tx.signup.update({ where: { id: signup.id }, data: { status: 'ATTENDED' } });
    await tx.user.update({
      where: { id: signup.userId },
      data: { points: { increment: signup.activity.points } },
    });
    return { ok: true as const, points: signup.activity.points };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, pointsAdded: result.points });
}
