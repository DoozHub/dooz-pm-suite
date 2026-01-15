# PM Suite Docker Deployment

FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ linux-headers

# Dependencies stage
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build UI stage
FROM base AS build-ui
WORKDIR /app/ui
COPY ui/package.json ui/bun.lock ./
RUN bun install --frozen-lockfile
COPY ui/ ./
RUN bun run build

# Production stage
FROM base AS production
WORKDIR /app

# Copy backend
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY drizzle.config.ts ./

# Copy built UI
COPY --from=build-ui /app/ui/dist ./ui/dist

# Create data directory
RUN mkdir -p data

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

# Run server
CMD ["bun", "run", "src/index.ts"]
