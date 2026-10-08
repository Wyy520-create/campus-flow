'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  activityId: string;
  capacity: number;
  points: number;
  initialCount: number;
  initialMine: boolean;
  loggedIn: boolean;
};

export default function SignupPanel({ activityId, capacity, points, initialCount, initialMine, loggedIn }: Props) {
  const [count, setCount] = useState(initialCount);
  const [mine, setMine] = useState(initialMine);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/events');
    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.type === 'signup-count' && event.activityId === activityId) {
          setCount(Number(event.signed));
        }
      } catch {
        // 忽略非 JSON 消息
      }
    };
    return () => source.close();
  }, [activityId]);

  const signup = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/activities/${activityId}/signup`, { method: 'POST' });
    if (r.ok) {
      const body = await r.json();
      setMine(true);
      setCount(Number(body.signed));
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '报名失败，请稍后再试');
    }
    setBusy(false);
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/activities/${activityId}/signup`, { method: 'DELETE' });
    if (r.ok) {
      const body = await r.json();
      setMine(false);
      setCount(Number(body.signed));
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '取消失败，请稍后再试');
    }
    setBusy(false);
  };

  const full = count >= capacity;

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-400">已报名 / 名额</p>
          <p className="text-3xl font-bold">
            {count}
            <span className="text-base font-normal text-slate-500"> / {capacity}</span>
          </p>
        </div>
        <p className="text-sm text-amber-300/90">完成可得 {points} 积分</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${capacity > 0 ? Math.min(100, (count / capacity) * 100) : 0}%` }}
        />
      </div>

      {!loggedIn ? (
        <div className="flex gap-2">
          <Link href="/login" className="btn-primary flex-1 text-center">登录后报名</Link>
          <Link href="/register" className="btn-ghost flex-1 text-center">注册账号</Link>
        </div>
      ) : mine ? (
        <button onClick={cancel} disabled={busy} className="btn-ghost w-full disabled:opacity-50">
          {busy ? '处理中…' : '取消报名'}
        </button>
      ) : (
        <button onClick={signup} disabled={busy || full} className="btn-primary w-full disabled:opacity-50">
          {full ? '名额已满' : busy ? '处理中…' : '立即报名'}
        </button>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-xs text-slate-500">报名数据通过 SSE 实时推送，打开两个浏览器窗口即可看到同步效果。</p>
    </div>
  );
}
