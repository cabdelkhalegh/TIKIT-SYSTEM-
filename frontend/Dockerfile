# TIKIT Frontend - Dockerfile
# This is a placeholder for future React/Next.js implementation

FROM node:18-alpine

WORKDIR /app

# Install dependencies for future use
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code (placeholder)
COPY src ./src

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Placeholder command - will be replaced when implementing actual frontend
CMD ["node", "-e", "console.log('Frontend placeholder - To be implemented with React/Next.js'); setInterval(() => {}, 1000)"]
