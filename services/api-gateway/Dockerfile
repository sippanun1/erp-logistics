FROM node:20-alpine AS builder
WORKDIR /app

COPY shared/ ./shared/

COPY services/api-gateway/package*.json ./services/api-gateway/
WORKDIR /app/services/api-gateway
RUN npm install

COPY services/api-gateway/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/api-gateway
COPY services/api-gateway/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/api-gateway/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
