import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'cf_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.AUTH_SECRET || 'campus-flow-dev-secret';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export function createSessionValue(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${userId}.${exp}.${sign(`${userId}.${exp}`)}`;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  points: number;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [userId, exp, sig] = raw.split('.');
  if (!userId || !exp || !sig) return null;
  const expected = sign(`${userId}.${exp}`);
  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, points: true },
  });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
