FROM node:lts-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm ci --omit=dev

FROM node:lts-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM base AS builder
RUN npm ci
COPY . .
RUN npx nest build

FROM node:lts-alpine AS release
RUN apk add --no-cache tini bash
WORKDIR /app
ARG VERSION
ENV NODE_ENV=production
ENV COOKIE_FILE=/cookies.txt
ENV CONFIG_FILE=/config.yaml
ENV DATA_DIR=/data
ENV VERSION=$VERSION
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=client-builder /app/public/dist ./public/dist
VOLUME ["/data"]
ENTRYPOINT ["/sbin/tini", "--", "node", "dist/main"]
