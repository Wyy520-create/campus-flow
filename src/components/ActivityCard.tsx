'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CATEGORY_GRADIENT, FALLBACK_GRADIENT } from '@/lib/activity-display';

export type ActivityCardData = {
  id: string;
  title: string;
  category: string;
  location: string;
  startLabel: string;
  capacity: number;
  signed: number;
  points: number;
  description: string;
};

export default function ActivityCard({ a, index = 0 }: { a: ActivityCardData; index?: number }) {
  const left = Math.max(a.capacity - a.signed, 0);
  const pct = a.capacity > 0 ? Math.min(100, Math.round((a.signed / a.capacity) * 100)) : 0;
  const gradient = CATEGORY_GRADIENT[a.category] ?? FALLBACK_GRADIENT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        href={`/activities/${a.id}`}
        className="card block overflow-hidden transition hover:border-indigo-400/60"
      >
        <div className={`flex h-24 items-end bg-gradient-to-br ${gradient} p-4`}>
          <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-xs text-white">{a.category}</span>
        </div>
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-1 text-lg font-semibold">{a.title}</h3>
          <p className="text-sm text-slate-400">
            {a.location} · {a.startLabel}
          </p>
          <div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>已报名 {a.signed}/{a.capacity}</span>
              <span>剩余 {left} 个名额</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <p className="text-xs text-amber-300/90">完成可得 {a.points} 积分</p>
        </div>
      </Link>
    </motion.div>
  );
}
