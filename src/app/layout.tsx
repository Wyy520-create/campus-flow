import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Campus Flow · 校园活动与志愿者协作平台',
  description: '发现校园活动、报名志愿岗位、累计公益积分，与同学一起让校园生活流动起来。',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
          Campus Flow · 演示平台 · MIT License
        </footer>
      </body>
    </html>
  );
}
