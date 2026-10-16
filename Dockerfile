# syntax=docker/dockerfile:1

# ---- base: Node 22 with npm 11, matching the npm used to write package-lock.json ----
# (npm 10 rejects lockfiles written by npm 11; see README troubleshooting.)
FROM node:22-alpine AS base
RUN npm install -g npm@11 && npm cache clean --force

# ---- build: compile TypeScript with dev dependencies ----
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- deps: production-only node_modules ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime: minimal image, non-root ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 8082
# Exec form so node is PID 1 and receives SIGTERM from Kubernetes directly.
CMD ["node", "dist/main.js"]
