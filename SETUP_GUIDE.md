# DriveSafe India — Complete Setup Guide
## Windows + VS Code (Beginner Friendly)

This guide takes you from zero to a fully running DriveSafe India app on Windows.

---

## Prerequisites — Install These First

### 1. Node.js (v18 or later)
1. Go to https://nodejs.org
2. Click **"LTS"** (the left green button)
3. Run the installer — keep all defaults
4. Verify: open PowerShell and run:
   ```powershell
   node --version   # should print v18.x.x or higher
   npm --version    # should print 9.x.x or higher
   ```

### 2. Git
1. Go to https://git-scm.com/download/windows
2. Download and run the installer (keep all defaults)
3. Verify:
   ```powershell
   git --version
   ```

### 3. VS Code
1. Go to https://code.visualstudio.com
2. Download and install
3. Recommended extensions to install in VS Code:
   - **Prisma** (by Prisma)
   - **ESLint**
   - **Tailwind CSS IntelliSense**

### 4. Docker Desktop (Optional — only for local PostgreSQL)
Skip this if you're using Supabase (recommended for beginners).
- https://www.docker.com/products/docker-desktop/

---

## Step 1 — Get the Project

### Option A: Download the ZIP
1. Download or extract the project folder to your desktop
2. Name the folder `drivesafe-india`

### Option B: Clone from Git
```powershell
cd C:\Users\YourName\Desktop
git clone <your-repo-url> drivesafe-india
cd drivesafe-india
```

Open the project in VS Code:
```powershell
code .
```

---

## Step 2 — Open the Terminal in VS Code

1. In VS Code, press **Ctrl + `** (backtick key, top-left of keyboard)
2. A PowerShell terminal opens at the bottom
3. Make sure you're in the project root:
   ```powershell
   # Should show: drivesafe-india
   Get-Location
   ```

---

## Step 3 — Install Dependencies

```powershell
npm install
```

Wait for this to complete (may take 2–3 minutes on first run).

---

## Step 4 — Set Up the Database

### Option A: Supabase (Recommended — free, no Docker needed)

1. Go to https://supabase.com and sign up (free)
2. Click **"New Project"**, name it `drivesafe-india`
3. Set a strong database password (save it!)
4. Wait 2 minutes for the project to start
5. Go to **Settings → Database → Connection string → URI**
6. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### Option B: Local PostgreSQL with Docker
```powershell
docker compose up -d postgres
# Wait 10 seconds, then use:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drivesafe_dev
```

---

## Step 5 — Configure Environment Variables

### Backend (.env)
```powershell
# Copy the example file
Copy-Item .env.example .env
```

Now open `.env` in VS Code and fill in:

```env
# REQUIRED — paste your Supabase connection string
DATABASE_URL=postgresql://postgres:YOURPASSWORD@db.YOURREF.supabase.co:5432/postgres

# REQUIRED — generate random secrets
# Run this in PowerShell to generate:
# [System.Web.Security.Membership]::GeneratePassword(64,0)
# Or just use any 64-character random string:
JWT_SECRET=changethis-to-a-random-64-character-string-for-production-use-now
JWT_REFRESH_SECRET=changethis-too-to-a-different-random-64-char-string-please!!

# Leave these as-is for development:
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
DEV_BYPASS_AUTH=true
DEV_OTP=123456
```

### Frontend (.env)
```powershell
Copy-Item apps\web\.env.example apps\web\.env
```

Open `apps/web/.env` — for development, leave it as:
```env
VITE_API_URL=/api
VITE_DEV_AUTH=true
```

---

## Step 6 — Run Database Migrations

```powershell
npm run db:generate
npm run db:migrate
```

When prompted for a migration name, type: `initial`

You should see:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema.
```

---

## Step 7 — Seed Development Data

```powershell
npm run db:seed
```

You should see:
```
✅ Service zones created
✅ Pricing rules created
✅ Customer user created: +919999999901
✅ Driver user created: +919999999902
✅ Admin user created: +919999999900
🎉 Seed completed!
```

---

## Step 8 — Start the Application

You need **two terminal windows** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend
```powershell
npm run dev --workspace=apps/api
```

Look for:
```
✅ Database connected
🚗 DriveSafe India API Server
   Port: 3001
```

### Terminal 2 — Open a New Terminal (Ctrl+Shift+`)
```powershell
npm run dev --workspace=apps/web
```

Look for:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 9 — Verify Everything is Working

### Check the API health:
Open in browser: http://localhost:3001/health

You should see:
```json
{"status":"ok","service":"DriveSafe India API"}
```

### Open the app:
Go to: **http://localhost:5173**

You should see the DriveSafe India landing page! 🎉

---

## Step 10 — Log In with Dev Accounts

Since `DEV_BYPASS_AUTH=true`, you can log in with any of these numbers:

| Role | Phone | OTP |
|------|-------|-----|
| Customer | 9999999901 | 123456 |
| Driver | 9999999902 | 123456 |
| Admin | 9999999900 | 123456 |

1. Go to http://localhost:5173/login
2. Enter the phone number (just the 10 digits, e.g. `9999999901`)
3. Click **Send OTP**
4. The yellow dev-mode box shows up — enter `123456`
5. Click **Verify & Continue**

---

## Step 11 — Test a Complete Booking

### As Customer:
1. Log in as customer (`9999999901`)
2. Click **Book Ride**
3. Enter pickup: `Koramangala, Bangalore`
4. Enter destination: `MG Road, Bangalore`
5. Select a date/time in the future
6. Click **Get Fare Estimate** — you'll see the breakdown
7. Click **Confirm & Book Driver**

### As Driver (in another browser window):
1. Open a private/incognito window → http://localhost:5173/login
2. Log in as driver (`9999999902`)
3. Toggle yourself **Online**
4. You'll see the new booking request appear
5. Click **Accept**

### Back as Customer:
1. Your booking status updates to "Driver Assigned"
2. You'll see the driver's name and details
3. Note the 6-digit OTP shown on your booking

### Back as Driver:
1. Click **I'm on the way** → **I've Arrived**
2. Enter the OTP from the customer → **Start Trip**
3. Click **Complete Trip**

### Payment (Customer):
1. The booking shows "Payment Pending"
2. Click **Pay ₹XXX**
3. Mock payment is processed instantly (no real money!)

---

## Step 12 — Test Admin Operations

1. Log in as admin (`9999999900`)
2. Dashboard shows stats
3. Go to **Drivers** — you can verify/suspend drivers
4. Go to **Bookings** — you can manually assign drivers

---

## Running Tests

```powershell
# Run all tests
npm run test

# Type-check everything
npm run typecheck

# Lint code
npm run lint
```

---

## Useful Commands Reference

| Command | What it does |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start both backend and frontend |
| `npm run dev --workspace=apps/api` | Start only the backend |
| `npm run dev --workspace=apps/web` | Start only the frontend |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client after schema changes |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed dev data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Troubleshooting

### ❌ "npm: command not found"
Node.js isn't installed or not in PATH. Reinstall Node.js from https://nodejs.org

### ❌ "Database connection failed"
- Check your `DATABASE_URL` in `.env` is correct
- Make sure Supabase project is running
- Check there are no special characters in the password (URL-encode them if needed)

### ❌ "Cannot find module '@drivesafe/shared'"
```powershell
npm install
# Then try again
```

### ❌ Port 3001 already in use
```powershell
# Find and kill the process
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

### ❌ Port 5173 already in use
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### ❌ "Prisma client not generated"
```powershell
npm run db:generate
```

### ❌ Frontend shows blank page
- Open browser DevTools (F12) → Console — look for error messages
- Check that the backend is running at http://localhost:3001/health
- Clear browser cache: Ctrl + Shift + R

### ❌ Login shows "Invalid token"
- Make sure `DEV_BYPASS_AUTH=true` is set in `.env`
- Make sure `VITE_DEV_AUTH=true` is set in `apps/web/.env`
- Restart both servers after changing `.env` files

### ❌ "Cannot POST /api/auth/login" (404)
The Vite proxy isn't connecting to the backend:
- Make sure the backend is running on port 3001
- Check `apps/web/vite.config.ts` proxy settings

---

## Ports Used

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |
| Prisma Studio | 5555 | http://localhost:5555 |
| PostgreSQL (Docker) | 5432 | — |

---

## Project Structure Quick Reference

```
drivesafe-india/
├── apps/
│   ├── api/          ← Node.js + Express backend
│   │   └── src/
│   │       ├── modules/auth/     ← Login, OTP, JWT
│   │       ├── modules/booking/  ← Booking CRUD
│   │       ├── modules/driver/   ← Driver ops
│   │       ├── modules/admin/    ← Admin endpoints
│   │       └── server.ts         ← Entry point
│   └── web/          ← React + Vite frontend
│       └── src/
│           ├── pages/            ← All page components
│           ├── components/       ← Reusable UI
│           └── features/auth/    ← Auth context
├── packages/shared/  ← Shared types + schemas
├── prisma/
│   ├── schema.prisma ← Database schema
│   └── seed.ts       ← Dev data
├── .env              ← Backend environment (create from .env.example)
├── apps/web/.env     ← Frontend environment
└── SETUP_GUIDE.md    ← This file
```

---

## Dev Account Summary

```
┌─────────────────────────────────────────────────────┐
│  DEV ACCOUNTS (DEV_BYPASS_AUTH=true required)        │
├──────────────┬─────────────────┬────────────────────┤
│ Role         │ Phone           │ OTP                │
├──────────────┼─────────────────┼────────────────────┤
│ Customer     │ +91 99999 99901 │ 123456             │
│ Driver       │ +91 99999 99902 │ 123456             │
│ Admin        │ +91 99999 99900 │ 123456             │
└──────────────┴─────────────────┴────────────────────┘
```

---

## What Works in This Prototype

✅ Customer login with phone OTP (dev bypass + real Firebase)
✅ Booking creation with fare calculation
✅ Driver assignment (automatic or manual via admin)
✅ Full ride status flow (Assigned → En Route → Arrived → Started → Completed)
✅ OTP verification to start trip
✅ Mock payment processing
✅ Admin dashboard with stats
✅ Driver availability toggle
✅ Booking history
✅ Real-time status polling

## Known Limitations (Prototype)

- Google Maps integration requires `VITE_GOOGLE_MAPS_API_KEY` — map shows placeholder
- Real Razorpay payments require `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Real Firebase phone OTP requires Firebase configuration
- Socket.IO real-time tracking works but location shows as coordinates (no live map)
- Driver document upload UI not built (backend API ready)
- Email/SMS notifications not configured

---

*DriveSafe India Prototype — For demonstration and submission purposes.*
*Not intended for commercial production without further security review and compliance assessment.*
