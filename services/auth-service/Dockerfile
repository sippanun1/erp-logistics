FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Copy shared types (needed for TypeScript compilation)
COPY shared/ ./shared/

# Copy service files
COPY services/auth-service/package*.json ./services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install

COPY services/auth-service/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app/services/auth-service
COPY services/auth-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/services/auth-service/node_modules/.prisma ./node_modules/.prisma
COPY services/auth-service/prisma ./prisma

EXPOSE 3001
CMD ["sh", "-c", "echo 'CREATE SCHEMA IF NOT EXISTS auth;' | npx prisma db execute --stdin && npx prisma migrate deploy && node dist/services/auth-service/src/index.js"]
