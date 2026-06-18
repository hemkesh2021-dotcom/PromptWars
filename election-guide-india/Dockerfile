# ============================================
# Election Guide India — Dockerfile
# Optimized multi-stage build for Google Cloud Run
# ============================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# Stage 2: Production image
FROM node:22-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY package.json server.js ./
COPY public/ ./public/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Cloud Run uses PORT env var (defaults to 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
