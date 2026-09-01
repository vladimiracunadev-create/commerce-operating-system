FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
RUN pnpm install --filter commerce-os-api --frozen-lockfile
COPY apps/api/src ./apps/api/src
RUN pnpm --dir apps/api run build

FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter commerce-os-api --prod --frozen-lockfile
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY apps/web ./apps/web
COPY packages/demo-core/index.js ./apps/web/demo-core.js
WORKDIR /workspace/apps/api
ENV PORT=8080
CMD ["node","dist/server.js"]
