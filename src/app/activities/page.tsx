import ActivitiesBrowser from '@/components/ActivitiesBrowser';
import { ActivityCardData } from '@/components/ActivityCard';
import { formatDateTime } from '@/lib/activity-display';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: '全部活动 · Campus Flow' };

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({ orderBy: { startTime: 'asc' } });
  const groups = await prisma.signup.groupBy({
    by: ['activityId'],
    where: { status: 'SIGNED' },
    _count: { _all: true },
  });
  const countMap = new Map(groups.map((g) => [g.activityId, g._count._all]));
  const cards: ActivityCardData[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    location: a.location,
    startLabel: formatDateTime(a.startTime),
    capacity: a.capacity,
    signed: countMap.get(a.id) ?? 0,
    points: a.points,
    description: a.description,
  }));

  return (
    <div className="container-x py-10">
      <h1 className="mb-2 text-3xl font-bold">全部活动</h1>
      <p className="mb-8 text-slate-400">共 {cards.length} 个活动，搜索与筛选均在浏览器本地完成，响应即时。</p>
      <ActivitiesBrowser activities={cards} />
    </div>
  );
}
