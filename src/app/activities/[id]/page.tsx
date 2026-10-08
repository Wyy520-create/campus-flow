import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORY_GRADIENT, FALLBACK_GRADIENT, formatDateTime } from '@/lib/activity-display';
import SignupPanel from '@/components/SignupPanel';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
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
  if (!activity) notFound();

  const me = await getSessionUser();
  const mine = me ? activity.signups.some((s) => s.user.id === me.id) : false;
  const gradient = CATEGORY_GRADIENT[activity.category] ?? FALLBACK_GRADIENT;

  return (
    <div className="container-x py-10">
      <Link href="/activities" className="text-sm text-indigo-300 hover:text-indigo-200">
        ← 返回活动列表
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-8`}>
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white">{activity.category}</span>
            <h1 className="mt-4 text-3xl font-bold text-white">{activity.title}</h1>
            <p className="mt-3 text-sm text-white/85">
              {formatDateTime(activity.startTime.toISOString())} ~ {formatDateTime(activity.endTime.toISOString())}
              {' · '}
              {activity.location}
            </p>
          </div>
          <div className="card mt-6 p-6">
            <h2 className="mb-3 font-semibold">活动介绍</h2>
            <p className="leading-relaxed text-slate-300">{activity.description}</p>
          </div>
          <div className="card mt-6 p-6">
            <h2 className="mb-3 font-semibold">已报名（{activity.signups.length}）</h2>
            {activity.signups.length === 0 ? (
              <p className="text-sm text-slate-500">还没有人报名，来做第一个吧。</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {activity.signups.map((s) => (
                  <li key={s.user.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300">
                    {s.user.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <SignupPanel
            activityId={activity.id}
            capacity={activity.capacity}
            points={activity.points}
            initialCount={activity.signups.length}
            initialMine={mine}
            loggedIn={!!me}
          />
        </div>
      </div>
    </div>
  );
}
