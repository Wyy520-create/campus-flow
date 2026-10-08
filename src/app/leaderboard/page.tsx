import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: '积分榜 · Campus Flow' };

const RANK_STYLE = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

export default async function LeaderboardPage() {
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

  return (
    <div className="container-x py-10">
      <h1 className="mb-2 text-3xl font-bold">志愿者积分榜</h1>
      <p className="mb-8 text-slate-400">积分由管理员确认到场后自动累计，相同积分按到达顺序排列。</p>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">排名</th>
              <th className="px-5 py-3 font-medium">昵称</th>
              <th className="px-5 py-3 font-medium">已完成活动</th>
              <th className="px-5 py-3 text-right font-medium">积分</th>
            </tr>
          </thead>
          <tbody>
            {top.map((u, i) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className={`px-5 py-3 font-bold ${RANK_STYLE[i] ?? 'text-slate-500'}`}>
                  {i + 1}
                </td>
                <td className="px-5 py-3">
                  {u.name}
                  {u.role === 'ADMIN' && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">管理员</span>}
                </td>
                <td className="px-5 py-3 text-slate-400">{u._count.signups}</td>
                <td className="px-5 py-3 text-right font-semibold text-amber-300">{u.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
