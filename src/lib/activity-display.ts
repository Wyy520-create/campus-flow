// 活动展示相关的纯函数与常量：不依赖 React，server / client 组件均可安全导入。
// 注意：不能把常量定义在 'use client' 模块里再给 server 组件做动态键访问（会触发
// "Cannot dot into a client module" 运行时错误）。

export const CATEGORY_GRADIENT: Record<string, string> = {
  志愿服务: 'from-emerald-500 to-teal-600',
  讲座: 'from-sky-500 to-indigo-600',
  文体: 'from-orange-500 to-rose-600',
  社团: 'from-fuchsia-500 to-purple-600',
  竞赛: 'from-amber-500 to-orange-600',
};

export const FALLBACK_GRADIENT = 'from-indigo-500 to-violet-600';

export function formatDateTime(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
