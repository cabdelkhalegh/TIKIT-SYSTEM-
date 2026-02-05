# TIKIT Backend API - Multi-stage Dockerfile

FROM node:20-alpine AS dependencies
WORKDIR /tikit-backend
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS development
WORKDIR /tikit-backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS production
WORKDIR /tikit-backend
COPY --from=dependencies /tikit-backend/node_modules ./node_modules
COPY . .
RUN addgroup -g 1001 -S tikitgroup && \
    adduser -S tikituser -u 1001
USER tikituser
EXPOSE 3001
CMD ["node", "src/server.js"]
