FROM node:20-alpine AS builder
WORKDIR /app

# Build-time args — must be declared here so Next.js can bake them into the bundle.
# NEXT_PUBLIC_WS_URL: WebSocket endpoint (browser connects directly to the gateway).
# API_GATEWAY_URL: server-side only — used by Next.js rewrites, never exposed to browser.
ARG NEXT_PUBLIC_WS_URL=ws://localhost:3000
ARG API_GATEWAY_URL=http://localhost:3000
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV API_GATEWAY_URL=$API_GATEWAY_URL

# Copy shared types (used by frontend too)
COPY shared/ ./shared/

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend/ .
# Ensure public/ always exists — Next.js requires it even when empty
RUN mkdir -p public
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production

# Pass API_GATEWAY_URL at runtime so Next.js rewrites resolve to the correct service
ARG API_GATEWAY_URL=http://localhost:3000
ENV API_GATEWAY_URL=$API_GATEWAY_URL

COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
