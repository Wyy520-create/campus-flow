# syntax=docker/dockerfile:1

# 阶段 1：安装全部依赖（含 devDependencies，供构建使用）
# 使用完整版 bookworm 镜像：自带 OpenSSL，Prisma 引擎检测稳定
FROM node:20-bookworm AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 阶段 2：构建生产版本（页面已标记 force-dynamic，构建期不需要真实数据库）
FROM node:20-bookworm AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_flow?schema=public"
RUN npx prisma generate && npm run build

# 阶段 3：生产运行镜像
FROM node:20-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev
EXPOSE 3000

# 启动时自动执行迁移与幂等种子数据，然后启动 Next.js 生产服务
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/seed.mjs && npm start"]
