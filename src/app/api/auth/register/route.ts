import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionValue, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().trim().min(2, '昵称至少 2 个字符').max(20, '昵称最多 20 个字符'),
  password: z.string().min(6, '密码至少 6 位').max(72, '密码最多 72 位'),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name: parsed.data.name,
      passwordHash: bcrypt.hashSync(parsed.data.password, 10),
    },
    select: { id: true, email: true, name: true, role: true, points: true },
  });
  const res = NextResponse.json(user, { status: 201 });
  res.cookies.set(SESSION_COOKIE, createSessionValue(user.id), sessionCookieOptions());
  return res;
}
