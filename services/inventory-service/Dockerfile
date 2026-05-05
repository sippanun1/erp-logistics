FROM node:20-alpine AS builder
WORKDIR /app

COPY shared/ ./shared/

COPY services/inventory-service/package*.json ./services/inventory-service/
WORKDIR /app/services/inventory-service
RUN npm install

COPY services/inventory-service/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/services/inventory-service
COPY services/inventory-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/inventory-service/dist ./dist
COPY --from=builder /app/services/inventory-service/node_modules/.prisma ./node_modules/.prisma
COPY services/inventory-service/prisma ./prisma

EXPOSE 3003
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/services/inventory-service/src/index.js"]
