'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Me = { id: string; name: string; role: 'STUDENT' | 'ADMIN' } | null;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then(async (r) => {
        if (alive) setMe(r.ok ? await r.json() : null);
      })
      .catch(() => undefined)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    router.push('/');
    router.refresh();
  };

  const links = [
    { href: '/', label: '首页' },
    { href: '/activities', label: '活动' },
    { href: '/leaderboard', label: '积分榜' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-x flex h-14 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Campus Flow" className="h-7 w-7" />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Campus Flow
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 transition ${
                pathname === l.href ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {ready && me && (
            <Link
              href="/me"
              className={`rounded-lg px-3 py-1.5 transition ${
                pathname === '/me' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              我的
            </Link>
          )}
          {ready && me?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-1.5 transition ${
                pathname === '/admin' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              发布活动
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {ready && !me && (
            <>
              <Link href="/login" className="btn-ghost">登录</Link>
              <Link href="/register" className="btn-primary">注册</Link>
            </>
          )}
          {ready && me && (
            <>
              <span className="hidden text-slate-400 sm:inline">{me.name}</span>
              <button onClick={logout} className="btn-ghost">退出</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
