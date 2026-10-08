'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['志愿服务', '讲座', '文体', '社团', '竞赛'];

export default function ActivityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '志愿服务',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '30',
    points: '5',
    description: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        location: form.location,
        description: form.description,
        capacity: Number(form.capacity),
        points: Number(form.points),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      }),
    });
    if (r.ok) {
      setDone(true);
      router.refresh();
      setForm({ title: '', category: '志愿服务', location: '', startTime: '', endTime: '', capacity: '30', points: '5', description: '' });
      setTimeout(() => setDone(false), 3000);
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '发布失败，请检查填写内容');
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">发布新活动</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input sm:col-span-2" placeholder="活动标题" value={form.title} onChange={set('title')} required maxLength={60} />
        <select className="input" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input className="input" placeholder="活动地点" value={form.location} onChange={set('location')} required maxLength={80} />
        <label className="block text-xs text-slate-400">
          开始时间
          <input type="datetime-local" className="input mt-1" value={form.startTime} onChange={set('startTime')} required />
        </label>
        <label className="block text-xs text-slate-400">
          结束时间
          <input type="datetime-local" className="input mt-1" value={form.endTime} onChange={set('endTime')} required />
        </label>
        <label className="block text-xs text-slate-400">
          名额
          <input type="number" min={1} max={5000} className="input mt-1" value={form.capacity} onChange={set('capacity')} required />
        </label>
        <label className="block text-xs text-slate-400">
          完成积分
          <input type="number" min={0} max={50} className="input mt-1" value={form.points} onChange={set('points')} required />
        </label>
      </div>
      <textarea
        className="input min-h-24"
        placeholder="活动描述（至少 5 个字符）"
        value={form.description}
        onChange={set('description')}
        required
        maxLength={2000}
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? '发布中…' : '发布活动'}
        </button>
        {done && <span className="text-sm text-emerald-400">发布成功，已出现在下方列表</span>}
        {error && <span className="text-sm text-rose-400">{error}</span>}
      </div>
    </form>
  );
}
