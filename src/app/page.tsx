import Link from 'next/link';
import HeroScene from '@/components/HeroScene';
import ActivityCard, { ActivityCardData } from '@/components/ActivityCard';
import { formatDateTime } from '@/lib/activity-display';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const upcoming = await prisma.activity.findMany({
    where: { startTime: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
    orderBy: { startTime: 'asc' },
    take: 3,
  });
  const groups = await prisma.signup.groupBy({
    by: ['activityId'],
    where: { status: 'SIGNED', activityId: { in: upcoming.map((a) => a.id) } },
    _count: { _all: true },
  });
  const countMap = new Map(groups.map((g) => [g.activityId, g._count._all]));
  const cards: ActivityCardData[] = upcoming.map((a) => ({
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

  const [userCount, activityCount, attendedCount, pointsAgg] = await Promise.all([
    prisma.user.count(),
    prisma.activity.count(),
    prisma.signup.count({ where: { status: 'ATTENDED' } }),
    prisma.user.aggregate({ _sum: { points: true } }),
  ]);
  const stats = [
    { label: '注册用户', value: userCount },
    { label: '发布活动', value: activityCount },
    { label: '参与人次', value: attendedCount },
    { label: '累计积分', value: pointsAgg._sum.points ?? 0 },
  ];

  return (
    <div>
      <section className="relative overflow-hidden">
        <HeroScene />
        <div className="container-x flex min-h-[68vh] flex-col items-center justify-center py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            让
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              校园生活
            </span>
            流动起来
          </h1>
          <p className="mt-6 max-w-xl text-slate-400">
            发现活动 · 一键报名 · 积分排行 · 实时同步。Campus Flow 把志愿服务、讲座竞赛和社团生活装进同一个平台。
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/activities" className="btn-primary">浏览活动</Link>
            <Link href="/leaderboard" className="btn-ghost">查看积分榜</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container-x grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-indigo-300">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold">近期精选活动</h2>
          <Link href="/activities" className="text-sm text-indigo-300 hover:text-indigo-200">
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((a, i) => (
            <ActivityCard key={a.id} a={a} index={i} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container-x py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">四步参与</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['注册登录', '使用邮箱注册，演示账号开箱即用'],
              ['发现活动', '按分类与关键词搜索，名额与积分一目了然'],
              ['现场参与', '报名后到场参加活动，管理员确认到场'],
              ['积分上榜', '积分自动累计，登上志愿者积分榜'],
            ].map(([title, desc], i) => (
              <div key={title} className="card p-5">
                <p className="text-3xl font-bold text-indigo-400/70">0{i + 1}</p>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
