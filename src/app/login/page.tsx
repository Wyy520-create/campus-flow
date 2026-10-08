'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      router.push('/me');
      router.refresh();
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '登录失败，请稍后再试');
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">登录</h1>
        <label className="block text-sm text-slate-400">
          邮箱
          <input type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm text-slate-400">
          密码
          <input type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? '登录中…' : '登录'}
        </button>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <p className="text-sm text-slate-400">
          还没有账号？<Link href="/register" className="text-indigo-300 hover:text-indigo-200">立即注册</Link>
        </p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          <p className="mb-1 font-medium text-slate-300">演示账号</p>
          <p>管理员：admin@campus.dev / admin123</p>
          <p>学生：chenxi@campus.dev / student123</p>
        </div>
      </form>
    </div>
  );
}
