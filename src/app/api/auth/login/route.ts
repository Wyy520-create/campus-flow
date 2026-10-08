import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionValue, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: '邮箱或密码不正确' }, { status: 401 });
  }
  const res = NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    points: user.points,
  });
  res.cookies.set(SESSION_COOKIE, createSessionValue(user.id), sessionCookieOptions());
  return res;
}
