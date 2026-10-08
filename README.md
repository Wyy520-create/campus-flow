# Campus Flow · 校园活动与志愿者协作平台

> 发现活动 · 一键报名 · 积分排行 · 实时同步。Next.js 全栈演示项目：React Three Fiber 3D 首页、Framer Motion 动效、Server-Sent Events 实时报名计数、Prisma + PostgreSQL 事务化报名。

![CI](https://github.com/Wyy520-create/campus-flow/actions/workflows/ci.yml/badge.svg) ![Next.js](https://img.shields.io/badge/Next.js-14.2-000000) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6) ![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2d3748) ![Three.js](https://img.shields.io/badge/Three.js-R3F-000000) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ed)

## 这是什么

Campus Flow 是一个面向校园场景的全栈演示平台：学生浏览活动、按名额报名，管理员发布活动并确认到场，到场后自动累计公益积分并生成排行榜。报名计数通过 SSE（Server-Sent Events）实时推送到所有在线页面。

项目内置演示账号和种子数据，clone 后无需任何外部账号、Token 或第三方服务。

## 核心能力

- **活动浏览与筛选**：分类标签 + 关键词搜索，全部在浏览器本地过滤，响应即时。
- **事务化报名**：`SIGNUP` 状态机（`SIGNED / CANCELLED / ATTENDED`），名额校验在 PostgreSQL 事务内完成，并发下不会超卖。
- **实时同步**：报名 / 取消后服务端发布事件，SSE 推送到所有在线客户端，多窗口可见同步效果。
- **积分与排行榜**：管理员确认到场后积分自动累计（幂等，重复点击不会重复加分），排行榜按积分排序。
- **会话安全**：密码 bcrypt 哈希存储；会话 Cookie 为 `userId.exp.HMAC-SHA256` 结构，httpOnly + 时序安全比较。
- **管理后台**：发布活动（zod 参数校验）、查看每个活动的报名名单、一键确认到场。
- **动态前端**：Three.js 粒子与几何体首页场景、Framer Motion 滚动入场动效、Tailwind 暗色主题，全站响应式。

## 架构

```text
浏览器 http://localhost:3000
        │
        ▼
Next.js 14（App Router，单容器）
  ├── React Server Components 直读 Prisma
  ├── Route Handlers：认证 / 活动 / 报名 / 到场 / 排行榜
  ├── SSE /api/events：进程内发布订阅 + ReadableStream
  ├── Three.js / Framer Motion 客户端组件
  └── Prisma ORM
        │
        ▼
PostgreSQL 16（Docker Compose 编排，自动迁移 + 幂等种子）
```

## 演示账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | admin@campus.dev | admin123 |
| 学生 | chenxi@campus.dev | student123 |
| 学生 | linman@campus.dev | student123 |
| 学生 | zhaolei@campus.dev | student123 |

## Docker 一键运行（推荐）

### 前置条件

- 安装 Docker Desktop（Windows/macOS）或 Docker Engine + Compose plugin（Linux）。
- 确认终端能执行：

```bash
docker --version
docker compose version
```

### Linux / macOS

```bash
git clone git@github.com:Wyy520-create/campus-flow.git
cd campus-flow
docker compose up -d --build
```

浏览器打开：`http://localhost:3000`

首次构建需要下载 Node 与 PostgreSQL 镜像并安装依赖，网络正常时约需数分钟；web 容器首次启动还会自动执行数据库迁移和种子数据，日志出现 `seed 完成` 后页面数据即就绪。

### Windows PowerShell

```powershell
git clone git@github.com:Wyy520-create/campus-flow.git
cd campus-flow
docker compose up -d --build
```

浏览器同样访问：`http://localhost:3000`。

> 没有 Git 也可以在仓库页面点击 **Code → Download ZIP**，解压后在该目录打开 PowerShell，再运行最后一条命令。

### 确认服务状态

```bash
docker compose ps
```

预期 `db` 与 `web` 均为 `running` / `healthy`。跟踪启动日志：

```bash
docker compose logs -f web
```

看到 `seed 完成：用户 4，活动 8，报名 12` 即表示演示数据就绪。

停止服务（保留数据库数据）：

```bash
docker compose down
```

如需连同演示数据一起清除：

```bash
docker compose down -v
```

## 本地开发（不使用 Docker）

本地开发要求 Node.js 20 与一个可用的 PostgreSQL 16。仅需体验功能时，请优先使用 Docker。

```bash
# 准备数据库
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_flow?schema=public"
# Windows PowerShell 用：$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_flow?schema=public"

npm ci
npx prisma migrate deploy
npm run seed
npm run dev
```

开发服务器默认 `http://localhost:3000`，修改代码热更新。

## API 快速验证

服务启动后，可直接用 curl 走一遍闭环：

```bash
# 活动列表（种子数据 8 条）
curl -s http://localhost:3000/api/activities | python3 -m json.tool | head -20

# 注册（自动写入会话 Cookie 到 /tmp/jar）
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@campus.dev","name":"演示同学","password":"demo123456"}' \
  -c /tmp/jar -o /dev/null

# 报名活动 a-002
curl -s -b /tmp/jar -X POST http://localhost:3000/api/activities/a-002/signup

# 查看该活动报名人数
curl -s http://localhost:3000/api/activities/a-002 | python3 -c "import json,sys; print(json.load(sys.stdin)['signed'])"
```

Windows PowerShell 中可使用 `curl.exe` 替代 `curl`；JSON 内双引号需要用反引号转义，例如 `\"email\"`。也可以直接用页面右上角“注册”按钮完成同样流程。

## 工程约束与测试策略

CI 只做确定性检查：ESLint、TypeScript 类型检查、生产构建（页面声明 `force-dynamic`，构建期不触库）、Docker Compose 启动后的一轮 API 冒烟（注册 → 报名 → 计数断言、管理员发布活动、积分榜断言）。不调用任何外部服务、付费 API；不通过失败重跑掩盖不稳定性。

浏览器级 E2E 不进入基础 CI，避免共享 runner 的浏览器时序噪声；本项目所有关键路径都有 API 级断言覆盖。

## 目录结构

```text
campus-flow/
├── src/
│   ├── app/                 # App Router 页面与 Route Handlers
│   │   ├── api/             # 认证 / 活动 / 报名 / 到场 / 排行榜 / SSE
│   │   ├── activities/      # 活动列表与详情
│   │   ├── login/ register/ # 认证页面
│   │   ├── me/              # 个人中心
│   │   ├── leaderboard/     # 积分榜
│   │   └── admin/           # 管理后台
│   ├── components/          # 3D 场景、卡片、报名面板、管理表单等
│   └── lib/                 # Prisma 单例、会话、SSE 发布订阅
├── prisma/                  # schema 与手写迁移 SQL
├── scripts/seed.mjs         # 幂等演示数据
├── Dockerfile               # 三阶段构建
├── compose.yaml             # PostgreSQL + Web 编排
└── README.md                # Linux / Windows 从零操作说明
```

## 说明

本项目的设计与实现重点：全栈闭环（页面 → API → 数据库 → 实时推送）、事务与幂等设计（名额校验、到场加分）、会话安全（HMAC 签名 Cookie），以及 Three.js / 动效带来的前端质感。几个值得一提的实现细节：

- **并发报名不超卖**：报名接口在单个 PostgreSQL 事务内完成“查重 → 已报名计数 → 名额校验 → 写入”，并发请求由数据库事务保证结果正确；
- **到场确认幂等**：确认到场前在事务内检查报名状态，已 `ATTENDED` 的直接返回，状态迁移与积分累加在同一事务提交，重复请求不会重复加分；
- **SSE 实时同步**：`/api/events` 基于进程内发布订阅 + `ReadableStream`，报名 / 取消后发布事件，所有在线页面计数无刷新同步，无需轮询；
- **无会话表**：会话 Cookie 为 `userId.exp.HMAC-SHA256` 结构，服务端只验签不存储会话，httpOnly + 时序安全比较。

## 运行界面

Docker Compose 启动后（`http://localhost:3000`）的实际运行效果，截图随仓库版本管理（`docs/screenshots/`）：

<img src="docs/screenshots/home.jpeg" alt="首页 · Three.js 3D 粒子场景与实时统计" width="100%" />
<img src="docs/screenshots/activities.jpeg" alt="活动列表 · 分类筛选与名额进度" width="49%" /> <img src="docs/screenshots/detail.jpeg" alt="活动详情 · SSE 实时报名面板" width="49%" />
<img src="docs/screenshots/leaderboard.jpeg" alt="积分榜 · 到场积分排行" width="49%" /> <img src="docs/screenshots/login.jpeg" alt="登录页 · 演示账号提示" width="49%" />
<img src="docs/screenshots/admin.jpeg" alt="管理后台 · 发布活动与确认到场" width="49%" /> <img src="docs/screenshots/me.jpeg" alt="个人中心 · 我的报名列表" width="49%" />

## License

MIT License. Copyright (c) 2026 余阳辉。
