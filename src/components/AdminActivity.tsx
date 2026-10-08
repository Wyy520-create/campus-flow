'use client';

import { useState } from 'react';

type Participant = { userId: string; name: string; status: 'SIGNED' | 'ATTENDED' | 'CANCELLED' };

type Props = {
  activity: {
    id: string;
    title: string;
    location: string;
    startLabel: string;
    capacity: number;
    points: number;
    participants: Participant[];
  };
};

export default function AdminActivity({ activity }: Props) {
  const [rows, setRows] = useState(activity.participants);
  const [error, setError] = useState<string | null>(null);

  const attend = async (userId: string) => {
    setError(null);
    const r = await fetch(`/api/activities/${activity.id}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (r.ok) {
      setRows((rs) => rs.map((row) => (row.userId === userId ? { ...row, status: 'ATTENDED' } : row)));
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '确认到场失败');
    }
  };

  const signed = rows.filter((r) => r.status === 'SIGNED');

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{activity.title}</h3>
        <span className="text-xs text-slate-400">
          {activity.startLabel} · {activity.location} · 名额 {activity.capacity} · {activity.points} 积分
        </span>
      </div>
      <div className="mt-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">暂无报名记录。</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.userId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-200">{row.name}</span>
                <span className="flex items-center gap-3">
                  {row.status === 'ATTENDED' ? (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">已到场 · 已发放 {activity.points} 积分</span>
                  ) : row.status === 'CANCELLED' ? (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-400">已取消</span>
                  ) : (
                    <>
                      <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs text-indigo-300">已报名</span>
                      <button onClick={() => attend(row.userId)} className="btn-ghost px-3 py-1 text-xs">
                        确认到场
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {signed.length === 0 && rows.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">当前没有待确认到场的报名。</p>
        )}
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
