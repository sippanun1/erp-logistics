# ERP Logistics System

## What Is This Project?

This is a **full-stack Enterprise Resource Planning (ERP) system** built for a **Warehouse / Third-Party Logistics (3PL) business**.

A 3PL company stores and ships goods on behalf of other businesses (their clients/customers). To run smoothly, they need software that connects three core operations: **receiving and tracking inventory**, **processing customer orders**, and **billing clients** — all in one place. That is what this system does.

### The Problem It Solves
Without an ERP, warehouse businesses rely on spreadsheets and disconnected tools. This causes:
- Stock going out of sync (selling goods that aren't actually in stock)
- No clear order status visibility for clients
- Manual invoice creation that's slow and error-prone
- No audit trail when stock discrepancies occur

### What This System Provides
- **Inventory control** — Real-time stock levels per product/SKU, atomic stock-in/stock-out transactions, automatic low-stock alerts, full transaction audit trail
- **Order management** — Full order lifecycle (PENDING → PROCESSING → SHIPPED → DELIVERED), role-based access so warehouse staff and customers see the right data
- **Billing** — Auto-generate invoices from completed orders, track payment status, financial reports
- **User access control** — Four roles (Admin, Warehouse Staff, Billing, Customer), each with their own dashboard and permissions
- **Real-time alerts** — WebSocket notifications when stock falls below reorder thresholds or order statuses change

### Who Uses It
| Role | What they do |
|---|---|
| **Admin** | Manage users, system configuration, full access |
| **Warehouse Staff** | Process orders, record stock movements |
| **Billing/Finance** | Generate and track invoices, view revenue reports |
| **Customer/Client** | Place orders, track their own shipments |

---

## Project Overview
A full-stack ERP for a Warehouse / 3PL logistics business. Built with microservices architecture for scalability and maintainability. Portfolio-grade but production-ready in design.

## Goals
- **Accuracy:** All data mutations are transactional; stock never goes negative
- **Security:** JWT RBAC, rate limiting, input validation at every boundary
- **Easy to maintain:** Isolated services, typed contracts, Prisma migrations
- **Easy to use:** Role-specific UIs, minimal clicks for common tasks
- **Scalability:** Stateless services, schema-per-service PostgreSQL, Docker

## Tech Stack
- **API Gateway:** Node.js + Express + TypeScript
- **Services:** Node.js + Express + TypeScript (×4)
- **Database:** PostgreSQL + Prisma ORM (one DB, four schemas)
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Real-time:** WebSockets (ws library)
- **Infra:** Docker Compose (dev), Docker (prod), Nginx (reverse proxy)

## Project Structure
```
erp-logistics/
├── services/
│   ├── api-gateway/           # Express — auth validation, reverse proxy, rate limiting
│   ├── auth-service/          # JWT, RBAC, user management
│   ├── order-service/         # Order lifecycle, status tracking
│   ├── inventory-service/     # Stock, warehouse locations, reorder alerts
│   └── billing-service/       # Invoices, payments, reports
├── frontend/                  # Next.js + TypeScript
│   ├── app/                   # App Router (Next.js 14+)
│   └── components/
├── shared/                    # Shared TypeScript types, error codes, constants
│   └── types/
│       └── index.ts
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── CLAUDE.md
```

Each service follows:
```
service/
├── src/
│   ├── controllers/    # Route handler functions
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, validation, error handling
│   ├── services/       # Business logic layer
│   └── index.ts        # App entry point
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── .env.example
├── package.json
└── tsconfig.json
```

## Services & Ports
| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Auth validation, routing, rate limiting |
| auth-service | 3001 | Users, roles, JWT issuance |
| order-service | 3002 | Order lifecycle management |
| inventory-service | 3003 | Stock, warehouse locations, alerts |
| billing-service | 3004 | Invoices, payments, reports |
| frontend (Next.js) | 3005 | Web UI |
| PostgreSQL | 5432 | Single DB, schema-per-service |

## User Roles
- **ADMIN** — full access, user management, system config
- **WAREHOUSE_STAFF** — manage stock, process orders
- **BILLING** — view orders, create/manage invoices
- **CUSTOMER** — place orders, track their own shipments only

## Commands
- `docker-compose up` — start all services + DB
- `docker-compose up --build` — rebuild and start
- `docker-compose up -d` — start in background
- `cd services/<name> && npx prisma migrate dev` — run migrations for a service
- `cd services/<name> && npx prisma studio` — open visual DB browser
- `cd services/<name> && npm run dev` — run a single service locally (needs .env)

## Environment Variables
Each service has its own `.env` file. See `.env.example` in each service directory.

Common variables:
- `DATABASE_URL` — PostgreSQL connection string (with schema search_path)
- `JWT_SECRET` — Secret for verifying access tokens (shared across gateway + auth)
- `PORT` — Service port
- `NODE_ENV` — `development` | `production`

Auth-service specific:
- `JWT_REFRESH_SECRET` — Separate secret for refresh tokens
- `ACCESS_TOKEN_EXPIRY` — e.g. `15m`
- `REFRESH_TOKEN_EXPIRY` — e.g. `7d`

## API Conventions
- All protected routes require `Authorization: Bearer <access_token>`
- API responses: `{ success: boolean, data?: T, error?: string, message?: string }`
- Validation errors: `{ success: false, error: "Validation failed", details: [...] }`
- Pagination: `{ success: true, data: [...], meta: { page, limit, total } }`

## Data Conventions
- Order statuses: `PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED`
- Stock transactions are **append-only** (never update stock directly — always insert a transaction)
- Invoice statuses: `DRAFT → SENT → PAID | OVERDUE | VOID`
- All timestamps use UTC, stored as `DateTime` in Prisma
- Soft deletes on Users and Products (`deletedAt` field)

## Security Rules
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
- Passwords hashed with bcrypt cost factor 12
- Rate limiting: 100 req/15min per IP on public routes, 1000 req/15min on authenticated routes
- CORS: only allow frontend origin
- Helmet.js enabled on all services
- Inter-service calls are internal-only (not routed through the gateway)

## TypeScript Conventions
- Strict mode enabled in all services
- No `any` types — use `unknown` and narrow
- Shared types imported from `../../shared/types`
- Zod used for runtime validation at all API boundaries

---

## Build Status (as of 2026-05-05)

### Infrastructure ✅
- `docker-compose.yml` — all 8 containers (postgres, 4 services, api-gateway, frontend, nginx) with health checks and proper startup ordering
- `nginx/nginx.conf` — routes `/api/` → api-gateway, `/` → frontend, WebSocket upgrade headers
- `scripts/init-db.sql` — creates all 4 PostgreSQL schemas (auth, orders, inventory, billing)
- `shared/types/index.ts` — 171 lines of shared TypeScript types across all services

### Auth Service (port 3001) ✅
- JWT issuance — access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (cost factor 12)
- RBAC middleware — validates role on every protected route
- Prisma schema — `User`, `RefreshToken` models
- Routes: register, login, refresh token, get/update users

### API Gateway (port 3000) ✅
- JWT validation on all incoming requests
- Reverse proxy routing to all 4 backend services
- Rate limiting (100 req/15min public, 1000 req/15min authenticated)
- **WebSocket server** — listens on `/ws`, authenticates via JWT query param, broadcasts events to connected clients

### Order Service (port 3002) ✅
- Full order lifecycle — `PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED`
- Role-based access (customers see only their own orders)
- Prisma schema — `Order`, `OrderItem` models
- Routes: create, list, get by ID, update status, cancel

### Inventory Service (port 3003) ✅
- Atomic stock transactions via `prisma.$transaction()` — stock never goes negative
- `currentStock` maintained as a denormalised column (no O(n) aggregation)
- `stockAfter` snapshot on every transaction for full audit trail
- Reorder threshold alerts published to WebSocket on stock-out
- Prisma schema — `Product`, `StockTransaction` models
- Routes: create/update/delete products, stock-in, stock-out, adjustment, transaction history

### Billing Service (port 3004) ✅
- Invoice generation from completed orders
- Payment status tracking — `DRAFT → SENT → PAID | OVERDUE | VOID`
- Prisma schema — `Invoice`, `InvoiceLineItem` models
- Routes: create invoice, list, get by ID, update status

### Frontend (port 3005) ✅
- Next.js 14 App Router with route groups `(auth)` and `(dashboard)`
- `middleware.ts` — JWT expiry check, redirects unauthenticated users to `/login`
- Pages: login, orders, inventory, billing, users
- `lib/api.ts` — typed API client with auth headers
- `lib/ws.ts` + `hooks/useWs.ts` — WebSocket client and React hook for real-time events
- Sidebar navigation with role-aware links

### Pending ⏳
- `docker-compose up --build` — needs a full end-to-end run to confirm all containers start healthy
- Frontend pages are scaffolded but need real API data wired in (fetch calls, loading states, forms)
- No seed script yet — demo data must be entered manually via API after first boot
- WebSocket broadcasts stock/order events but frontend toasts are not yet implemented
- End-to-end test: register → login → create order → move stock below threshold → confirm alert fires → generate invoice
