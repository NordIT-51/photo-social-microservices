# ---------- Stage 1: build ----------
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-setuptools make g++ libvips-dev \
 && rm -rf /var/lib/apt/lists/*

ENV npm_config_build_from_source=true
ENV npm_config_disturl=https://nodejs.org/download/release
ENV npm_config_fetch_retries=10
ENV npm_config_fetch_retry_mintimeout=10000
ENV npm_config_fetch_retry_maxtimeout=60000
ENV npm_config_fetch_timeout=180000
ENV npm_config_maxsockets=3

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --production

# ---------- Stage 2: runtime ----------
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN mkdir -p temp-uploads

EXPOSE 3001
CMD ["node", "dist/index.js"]
