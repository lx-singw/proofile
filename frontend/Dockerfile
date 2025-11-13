# Multi-stage build for development and production

# Development stage
FROM mcr.microsoft.com/playwright:v1.56.1-jammy AS development

WORKDIR /app

# Install dependencies for node-gyp
RUN apt-get update && apt-get install -y --no-install-recommends g++ make python3 && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies and Snyk CLI
RUN npm ci && npm install -g snyk
# Ensure npm is up-to-date (fixes "new npm version available" notices during build)
RUN npm install -g npm@latest

# Copy application code
COPY . .

# Ensure workspace ownership matches non-root user for dev workflows
RUN chown -R pwuser:pwuser /app

# Drop privileges for development runtime
USER pwuser

# Expose port
EXPOSE 3000

# Development command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]

# Dependencies stage
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
# Update npm in the deps image so subsequent stages use the newer npm
RUN npm install -g npm@latest

# Builder stage
FROM mcr.microsoft.com/playwright:v1.56.1-jammy AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm install -g snyk
# Update npm in the builder stage as well (matches development stage)
RUN npm install -g npm@latest

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy necessary files
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
