FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY shared/ ./shared/

COPY services/order-service/package*.json ./services/order-service/
WORKDIR /app/services/order-service
RUN npm install

COPY services/order-service/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app/services/order-service
COPY services/order-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/order-service/dist ./dist
COPY --from=builder /app/services/order-service/node_modules/.prisma ./node_modules/.prisma
COPY services/order-service/prisma ./prisma

EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/services/order-service/src/index.js"]
