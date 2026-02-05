# TIKIT Web Client - Multi-stage Dockerfile

FROM node:20-alpine AS dependencies
WORKDIR /tikit-web
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /tikit-web
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /tikit-web
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup -g 1001 -S tikitgroup && \
    adduser -S tikituser -u 1001
COPY --from=builder --chown=tikituser:tikitgroup /tikit-web/.next/standalone ./
COPY --from=builder --chown=tikituser:tikitgroup /tikit-web/.next/static ./.next/static
COPY --from=builder --chown=tikituser:tikitgroup /tikit-web/public ./public
USER tikituser
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-alpine AS development
WORKDIR /tikit-web
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
EXPOSE 3000
CMD ["npm", "run", "dev"]
