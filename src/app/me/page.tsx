import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/activity-display';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  SIGNED: { text: '已报名', cls: 'bg-indigo-500/15 text-indigo-300' },
  ATTENDED: { text: '已完成', cls: 'bg-emerald-500/15 text-emerald-300' },
  CANCELLED: { text: '已取消', cls: 'bg-white/10 text-slate-400' },
};

export default async function MePage() {
  const me = await getSessionUser();
  if (!me) redirect('/login');

  const signups = await prisma.signup.findMany({
    where: { userId: me.id },
    include: { activity: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{me.name}</h1>
          <p className="mt-1 text-slate-400">{me.email}{me.role === 'ADMIN' ? ' · 管理员' : ''}</p>
        </div>
        <div className="card px-6 py-4 text-center">
          <p className="text-3xl font-bold text-amber-300">{me.points}</p>
          <p className="text-xs text-slate-400">公益积分</p>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold">我的报名（{signups.length}）</h2>
      {signups.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-400">还没有报名任何活动。</p>
          <Link href="/activities" className="btn-primary mt-4 inline-block">去发现活动</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {signups.map((s) => {
            const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.CANCELLED;
            return (
              <Link key={s.id} href={`/activities/${s.activityId}`} className="card flex items-center justify-between gap-4 p-4 transition hover:border-indigo-400/60">
                <div>
                  <p className="font-medium">{s.activity.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDateTime(s.activity.startTime.toISOString())} · {s.activity.location}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${st.cls}`}>{st.text}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
