import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { publish } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

type Context = { params: { id: string } };

export async function POST(_req: Request, { params }: Context) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!activity) return NextResponse.json({ error: '活动不存在' }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.signup.findUnique({
        where: { userId_activityId: { userId: me.id, activityId: activity.id } },
      });
      if (existing?.status === 'SIGNED') return;
      const signed = await tx.signup.count({
        where: { activityId: activity.id, status: 'SIGNED' },
      });
      if (!existing && signed >= activity.capacity) {
        throw new Error('FULL');
      }
      if (existing) {
        await tx.signup.update({ where: { id: existing.id }, data: { status: 'SIGNED' } });
      } else {
        await tx.signup.create({
          data: { id: randomUUID(), userId: me.id, activityId: activity.id },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'FULL') {
      return NextResponse.json({ error: '名额已满' }, { status: 409 });
    }
    throw e;
  }

  const signed = await prisma.signup.count({
    where: { activityId: activity.id, status: 'SIGNED' },
  });
  publish({ type: 'signup-count', activityId: activity.id, signed });
  return NextResponse.json({ ok: true, signed });
}

export async function DELETE(_req: Request, { params }: Context) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  const existing = await prisma.signup.findUnique({
    where: { userId_activityId: { userId: me.id, activityId: params.id } },
  });
  if (existing && existing.status === 'SIGNED') {
    await prisma.signup.update({ where: { id: existing.id }, data: { status: 'CANCELLED' } });
    const signed = await prisma.signup.count({
      where: { activityId: params.id, status: 'SIGNED' },
    });
    publish({ type: 'signup-count', activityId: params.id, signed });
    return NextResponse.json({ ok: true, signed });
  }
  return NextResponse.json({ ok: true, signed: await prisma.signup.count({ where: { activityId: params.id, status: 'SIGNED' } }) });
}
