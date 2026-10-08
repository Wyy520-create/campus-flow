import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { publish } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category')?.trim();
  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
  };
  const [activities, groups] = await Promise.all([
    prisma.activity.findMany({ where, orderBy: { startTime: 'asc' } }),
    prisma.signup.groupBy({
      by: ['activityId'],
      where: { status: 'SIGNED' },
      _count: { _all: true },
    }),
  ]);
  const countMap = new Map(groups.map((g) => [g.activityId, g._count._all]));
  return NextResponse.json(activities.map((a) => ({ ...a, signed: countMap.get(a.id) ?? 0 })));
}

const createSchema = z.object({
  title: z.string().trim().min(2, '标题至少 2 个字符').max(60, '标题最多 60 个字符'),
  description: z.string().trim().min(5, '描述至少 5 个字符').max(2000, '描述最多 2000 字'),
  category: z.enum(['志愿服务', '讲座', '文体', '社团', '竞赛'], {
    errorMap: () => ({ message: '分类必须是：志愿服务 / 讲座 / 文体 / 社团 / 竞赛' }),
  }),
  location: z.string().trim().min(1, '请填写地点').max(80),
  startTime: z.coerce.date({ errorMap: () => ({ message: '开始时间格式不正确' }) }),
  endTime: z.coerce.date({ errorMap: () => ({ message: '结束时间格式不正确' }) }),
  capacity: z.coerce.number().int('名额必须是整数').min(1, '名额至少 1').max(5000, '名额最多 5000'),
  points: z.coerce.number().int('积分必须是整数').min(0, '积分不能为负').max(50, '积分最多 50'),
});

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  if (me.role !== 'ADMIN') return NextResponse.json({ error: '仅管理员可发布活动' }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (parsed.data.endTime.getTime() <= parsed.data.startTime.getTime()) {
    return NextResponse.json({ error: '结束时间必须晚于开始时间' }, { status: 400 });
  }
  const activity = await prisma.activity.create({
    data: { id: randomUUID(), creatorId: me.id, ...parsed.data },
  });
  publish({ type: 'activity-created', activityId: activity.id });
  return NextResponse.json(activity, { status: 201 });
}
