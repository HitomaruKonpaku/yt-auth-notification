FROM node:lts-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm ci --omit=dev

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM node:lts-alpine AS release
RUN apk add --no-cache tini bash
WORKDIR /app
ENV NODE_ENV=production
ENV COOKIE_FILE=/cookies.txt
ENV CONFIG_FILE=/config.yaml
ENV DATA_DIR=/data
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
VOLUME ["/data"]
ENTRYPOINT ["/sbin/tini", "--", "node", "dist/main"]
