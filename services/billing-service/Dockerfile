FROM node:20-alpine AS builder
WORKDIR /app

COPY shared/ ./shared/

COPY services/billing-service/package*.json ./services/billing-service/
WORKDIR /app/services/billing-service
RUN npm install

COPY services/billing-service/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/billing-service
COPY services/billing-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/billing-service/dist ./dist
COPY --from=builder /app/services/billing-service/node_modules/.prisma ./node_modules/.prisma
COPY services/billing-service/prisma ./prisma

EXPOSE 3004
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
