# 🚗 DriveSafe India

**India's Premium Designated Driver Booking Platform**

> Your car. Our driver. You relax.

DriveSafe India connects customers with professional, police-verified drivers who drive the **customer's own car** safely to the destination.

---

## Quick Start

```powershell
# 1. Install dependencies
npm install

# 2. Copy environment files
Copy-Item .env.example .env
Copy-Item apps\web\.env.example apps\web\.env

# 3. Edit .env — add your DATABASE_URL and JWT secrets

# 4. Run database migrations
npm run db:migrate

# 5. Seed dev data
npm run db:seed

# 6. Start everything
npm run dev
```

Open http://localhost:5173 — log in with phone `9999999901`, OTP `123456`.

**Full setup guide: [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | TanStack Query, React Hook Form |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | Firebase Phone Auth (+ dev bypass) |
| Real-time | Socket.IO |
| Payments | Razorpay (mock in dev) |

## Architecture

```
drivesafe-india/         ← npm workspaces monorepo
├── apps/web/            ← React + Vite frontend (port 5173)
├── apps/api/            ← Express API backend (port 3001)
├── packages/shared/     ← Shared types, schemas, constants
└── prisma/              ← Database schema + migrations
```

## Interfaces

- **Customer** — Book drivers, track rides, payment history
- **Driver** — Accept bookings, manage availability, earnings
- **Admin** — Manage users, verify drivers, monitor operations

## Dev Accounts (DEV_BYPASS_AUTH=true)

| Role | Phone | OTP |
|------|-------|-----|
| Customer | 9999999901 | 123456 |
| Driver | 9999999902 | 123456 |
| Admin | 9999999900 | 123456 |

---

*Prototype for demonstration. Not production-ready without security review.*
