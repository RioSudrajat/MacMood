# ==============================================================================
# MacMood POS & Kitchen Operating System - Production Dockerfile
# Multi-stage build for TanStack Start (Vinxi / Nitro / Vite) on Node.js 22 Alpine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build dependencies & compile application
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install package dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Set production environment and build the application
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create dedicated non-root user for security compliance
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 macmood

# Copy compiled standalone output from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set proper ownership to non-root user
USER macmood

# Expose HTTP port
EXPOSE 3000

# Healthcheck to verify Nitro server responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the TanStack Start production server
CMD ["node", ".output/server/index.mjs"]
