# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 py3-setuptools make g++ vips-dev

ENV npm_config_build_from_source=true

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --production

# ---------- Stage 2: runtime ----------
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache vips-dev

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN mkdir -p temp-uploads

EXPOSE 3003
CMD ["node", "dist/index.js"]
