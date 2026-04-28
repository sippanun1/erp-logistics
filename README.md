# ERP Logistics System

A full-stack ERP for a **Warehouse / 3PL logistics business**, built with a microservices architecture. Designed for accuracy, security, maintainability, and scalability.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Real-time | WebSockets |
| Infrastructure | Docker Compose + Nginx |

## Architecture

```
Browser (Next.js)
       │
  [ Nginx ]
       │
  [ API Gateway :3000 ]  ← JWT validation, rate limiting, WebSocket server
   /      |      \      \
Auth   Orders  Inventory  Billing
:3001  :3002    :3003     :3004
   \      |      /      /
      [ PostgreSQL ]
   (4 schemas: auth | orders | inventory | billing)
```

## Services

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Auth validation, routing, rate limiting, WebSockets |
| auth-service | 3001 | User registration/login, JWT issuance, RBAC |
| order-service | 3002 | Order lifecycle, status machine, audit log |
| inventory-service | 3003 | Stock transactions (append-only), low-stock alerts |
| billing-service | 3004 | Invoices, payments, revenue reports |
| frontend | 3005 | Next.js web UI |

## User Roles

| Role | Access |
|---|---|
| `ADMIN` | Full access — users, all modules, system config |
| `WAREHOUSE_STAFF` | Manage stock, process and update orders |
| `BILLING` | View orders, create and manage invoices |
| `CUSTOMER` | Place orders, track their own shipments only |

## Features

- **Order Management** — Full order lifecycle: `PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED`, with status audit log
- **Inventory** — Append-only stock transactions (STOCK_IN / STOCK_OUT / ADJUSTMENT), warehouse bin locations, automatic low-stock alerts
- **Billing** — Auto-numbered invoices (`INV-YYYYMM-0001`), 7% tax calculation, payment tracking, revenue reports
- **Real-time** — WebSocket alerts for low stock and live dashboard metrics
- **Security** — JWT (15 min access + 7 day refresh), bcrypt (cost 12), Helmet.js, CORS, rate limiting
- **Role-based UI** — Sidebar and routes change per role

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for running migrations locally)

### 1. Copy environment files

```bash
cp services/auth-service/.env.example      services/auth-service/.env
cp services/api-gateway/.env.example       services/api-gateway/.env
cp services/order-service/.env.example     services/order-service/.env
cp services/inventory-service/.env.example services/inventory-service/.env
cp services/billing-service/.env.example   services/billing-service/.env
```

> Edit each `.env` file and set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` values.

### 2. Start all services

```bash
docker-compose up --build
```

### 3. Run database migrations (first time only)

Open a new terminal and run for each service:

```bash
cd services/auth-service      && npx prisma migrate dev --name init
cd services/order-service     && npx prisma migrate dev --name init
cd services/inventory-service && npx prisma migrate dev --name init
cd services/billing-service   && npx prisma migrate dev --name init
```

### 4. Open the app

| URL | Description |
|---|---|
| http://localhost | Web UI (via Nginx) |
| http://localhost:3000/api | API Gateway |
| http://localhost:3000/health | Gateway health check |

## Project Structure

```
erp-logistics/
├── services/
│   ├── api-gateway/        # JWT validation, proxy routing, WebSocket server
│   ├── auth-service/       # Users, roles, JWT issuance
│   ├── order-service/      # Order lifecycle management
│   ├── inventory-service/  # Stock management, low-stock alerts
│   └── billing-service/    # Invoices, payments, reports
├── frontend/               # Next.js 14 + Tailwind CSS
├── shared/
│   └── types/              # Shared TypeScript types (single source of truth)
├── nginx/                  # Reverse proxy config
├── scripts/
│   └── init-db.sql         # Creates PostgreSQL schemas on first run
└── docker-compose.yml
```

Each service follows the same structure:
```
service/
├── src/
│   ├── controllers/    # Request handlers
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, validation, error handling
│   └── services/       # Business logic
├── prisma/
│   └── schema.prisma   # Database schema for this service
└── Dockerfile
```

## API Conventions

All responses follow:
```json
{ "success": true, "data": {} }
{ "success": false, "error": "message" }
```

All protected routes require:
```
Authorization: Bearer <access_token>
```

## Development (without Docker)

Run each service individually:
```bash
cd services/<name>
cp .env.example .env   # fill in values
npm install
npx prisma migrate dev
npm run dev
```
