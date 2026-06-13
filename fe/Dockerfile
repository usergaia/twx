# Production image for the Next.js 16 dashboard.
# Uses output:"standalone" (set in next.config.ts) for a minimal runtime layer.
# Dev is intentionally NOT containerized — run `npm run dev` on the host
# (Next's own docs recommend host dev on Mac/Windows for performance).

# 1. Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined into the browser bundle at build time, so they must
# point at host-published ports (the browser runs on the host, NOT inside the
# compose network — `ai:8001`/`n8n:5678` would not resolve there).
ARG NEXT_PUBLIC_AI_URL=http://localhost:8001
ARG NEXT_PUBLIC_N8N_URL=http://localhost:5678
ENV NEXT_PUBLIC_AI_URL=$NEXT_PUBLIC_AI_URL
ENV NEXT_PUBLIC_N8N_URL=$NEXT_PUBLIC_N8N_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Run the standalone server
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
