import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { id: 'u-admin', email: 'admin@campus.dev', name: '系统管理员', password: 'admin123', role: 'ADMIN' },
  { id: 'u-001', email: 'chenxi@campus.dev', name: '陈曦', password: 'student123', role: 'STUDENT' },
  { id: 'u-002', email: 'linman@campus.dev', name: '林蔓', password: 'student123', role: 'STUDENT' },
  { id: 'u-003', email: 'zhaolei@campus.dev', name: '赵磊', password: 'student123', role: 'STUDENT' },
];

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function at(hoursFromNow, extraHours = 2) {
  const start = new Date(Date.now() + hoursFromNow * HOUR);
  return { startTime: start, endTime: new Date(start.getTime() + extraHours * HOUR) };
}

const activities = [
  {
    id: 'a-001', title: '图书馆周末志愿服务', category: '志愿服务', location: '校图书馆一层大厅',
    description: '协助图书整理、借阅引导与阅览室秩序维护，适合想要安静做志愿服务的同学。',
    points: 6, capacity: 30, ...at(72, 4),
  },
  {
    id: 'a-002', title: '人工智能前沿讲座：大模型时代的软件工程', category: '讲座', location: '学术报告厅 A',
    description: '邀请业内工程师分享大模型辅助研发的真实落地案例，现场设有答疑环节。',
    points: 4, capacity: 200, ...at(96, 2),
  },
  {
    id: 'a-003', title: '新生杯篮球联赛', category: '文体', location: '东区体育馆',
    description: '五人制小组赛加淘汰赛，欢迎组队报名，也招募记录台与裁判助理志愿者。',
    points: 5, capacity: 50, ...at(120, 3),
  },
  {
    id: 'a-004', title: '校园马拉松志愿者', category: '志愿服务', location: '中央操场',
    description: '赛道引导、补给站分发与终点接待，是校内人气最高的志愿岗位之一。',
    points: 8, capacity: 80, ...at(144, 5),
  },
  {
    id: 'a-005', title: '摄影社团外拍：城市夜景', category: '社团', location: '学校南门集合',
    description: '集体前往江边拍摄夜景，社团提供反光板与补光灯，欢迎零基础同学。',
    points: 3, capacity: 20, ...at(48, 3),
  },
  {
    id: 'a-006', title: '程序设计竞赛校内选拔', category: '竞赛', location: '计算中心 302',
    description: '面向省赛与区域赛的校内选拔，优胜者将入选校队并获得集训名额。',
    points: 10, capacity: 60, ...at(168, 4),
  },
  {
    id: 'a-007', title: '迎新晚会节目彩排协助', category: '文体', location: '大学生活动中心',
    description: '协助灯光音响调试、道具搬运与候场引导，可近距离观看全部彩排节目。',
    points: 4, capacity: 40, ...at(24, 3),
  },
  {
    id: 'a-008', title: '开源软件工作坊', category: '讲座', location: '创新工坊 B203',
    description: '从零开始给开源项目提交第一个 Pull Request，现场有助教手把手指导。',
    points: 5, capacity: 45, ...at(60, 3),
  },
];

// [signupId, userId, activityId, status]
const signups = [
  ['s-001', 'u-001', 'a-001', 'ATTENDED'],
  ['s-002', 'u-001', 'a-004', 'ATTENDED'],
  ['s-003', 'u-001', 'a-006', 'SIGNED'],
  ['s-004', 'u-002', 'a-002', 'ATTENDED'],
  ['s-005', 'u-002', 'a-004', 'ATTENDED'],
  ['s-006', 'u-002', 'a-005', 'SIGNED'],
  ['s-007', 'u-002', 'a-008', 'SIGNED'],
  ['s-008', 'u-003', 'a-003', 'ATTENDED'],
  ['s-009', 'u-003', 'a-004', 'SIGNED'],
  ['s-010', 'u-003', 'a-007', 'SIGNED'],
  ['s-011', 'u-001', 'a-008', 'SIGNED'],
  ['s-012', 'u-002', 'a-001', 'SIGNED'],
];

async function main() {
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: bcrypt.hashSync(u.password, 10),
      },
    });
  }

  for (const a of activities) {
    await prisma.activity.upsert({
      where: { id: a.id },
      update: {},
      create: { creatorId: 'u-admin', ...a },
    });
  }

  for (const [id, userId, activityId, status] of signups) {
    await prisma.signup.upsert({
      where: { id },
      update: {},
      create: { id, userId, activityId, status },
    });
  }

  // 用户积分始终由“已到场（ATTENDED）报名的活动积分”汇总而来，保证可解释、可重算
  const attended = await prisma.signup.findMany({
    where: { status: 'ATTENDED' },
    include: { activity: true },
  });
  const pointMap = new Map();
  for (const s of attended) {
    pointMap.set(s.userId, (pointMap.get(s.userId) ?? 0) + s.activity.points);
  }
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { points: pointMap.get(u.id) ?? 0 },
    });
  }

  const [userCount, activityCount, signupCount] = await Promise.all([
    prisma.user.count(),
    prisma.activity.count(),
    prisma.signup.count(),
  ]);
  console.log(`seed 完成：用户 ${userCount}，活动 ${activityCount}，报名 ${signupCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
