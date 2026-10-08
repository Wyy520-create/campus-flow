import { redirect } from 'next/navigation';
import ActivityForm from '@/components/ActivityForm';
import AdminActivity from '@/components/AdminActivity';
import { formatDateTime } from '@/lib/activity-display';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: '发布活动 · Campus Flow' };

export default async function AdminPage() {
  const me = await getSessionUser();
  if (!me) redirect('/login');
  if (me.role !== 'ADMIN') redirect('/');

  const activities = await prisma.activity.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      signups: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return (
    <div className="container-x space-y-8 py-10">
      <h1 className="text-3xl font-bold">活动管理</h1>
      <ActivityForm />
      <div className="space-y-4">
        <h2 className="text-xl font-bold">已有活动（{activities.length}）</h2>
        {activities.map((a) => (
          <AdminActivity
            key={a.id}
            activity={{
              id: a.id,
              title: a.title,
              location: a.location,
              startLabel: formatDateTime(a.startTime),
              capacity: a.capacity,
              points: a.points,
              participants: a.signups.map((s) => ({
                userId: s.user.id,
                name: s.user.name,
                status: s.status,
              })),
            }}
          />
        ))}
      </div>
    </div>
  );
}
