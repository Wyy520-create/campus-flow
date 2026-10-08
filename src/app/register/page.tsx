'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      router.push('/me');
      router.refresh();
    } else {
      const body = await r.json().catch(() => ({}));
      setError(body.error || '注册失败，请稍后再试');
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">注册</h1>
        <label className="block text-sm text-slate-400">
          邮箱
          <input
            type="email"
            className="input mt-1"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm text-slate-400">
          昵称
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            minLength={2}
            maxLength={20}
          />
        </label>
        <label className="block text-sm text-slate-400">
          密码（至少 6 位）
          <input
            type="password"
            className="input mt-1"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? '注册中…' : '注册并登录'}
        </button>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <p className="text-sm text-slate-400">
          已有账号？<Link href="/login" className="text-indigo-300 hover:text-indigo-200">直接登录</Link>
        </p>
      </form>
    </div>
  );
}
