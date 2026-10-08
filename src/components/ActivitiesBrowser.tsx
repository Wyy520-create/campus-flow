'use client';

import { useMemo, useState } from 'react';
import ActivityCard, { ActivityCardData } from './ActivityCard';

const CATEGORIES = ['全部', '志愿服务', '讲座', '文体', '社团', '竞赛'];

export default function ActivitiesBrowser({ activities }: { activities: ActivityCardData[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return activities.filter((a) => {
      const hitCategory = category === '全部' || a.category === category;
      const hitKeyword =
        !kw ||
        a.title.toLowerCase().includes(kw) ||
        a.location.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw);
      return hitCategory && hitKeyword;
    });
  }, [activities, search, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索活动标题、地点或描述"
          className="input sm:w-80"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                category === c
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-slate-500">没有匹配的活动，换个关键词试试。</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <ActivityCard key={a.id} a={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
