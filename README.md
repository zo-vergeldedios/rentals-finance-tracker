# Rentals Finance Tracker

A full-stack web app to track income, expenses, and net profit for an Airbnb rental business, with per-month charts and averages on an interactive dashboard.

## Features

- **Authentication** — register and log in with username + password (JWT-based)
- **Income & Expense logs** — add entries with amount, category, and date (defaults to today, changeable per month)
- **Dashboard**
  - Monthly net profit (bar chart)
  - Monthly income / expense breakdown (pie charts)
  - Average monthly net profit, income, and expense
- **Multi-user** — each user sees only their own data

## Tech Stack

| Layer    | Technologies                                                        |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 18, Vite 5, TypeScript, Recharts, SheetJS (xlsx)              |
| Backend  | Node.js, Express 4, TypeScript                                      |
| Database | PostgreSQL (`pg`) — PGlite for local testing                        |
| Auth     | JSON Web Tokens (JWT) + bcrypt password hashing                     |
| Deploy   | Railway (production), concurrently for local dev                    |
| Testing  | Supertest + Node's built-in test runner                             |

## Project Structure

```
rentals-finance-tracker/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Dashboard, Income/Expense pages
│       ├── components/     # Reusable UI
│       ├── api.ts          # API client
│       └── types.ts        # Shared types
├── server/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts        # App entry + static file serving
│   │   ├── auth.ts         # JWT sign/verify + middleware
│   │   ├── db.ts           # Postgres pool + schema init
│   │   └── routes/         # /auth, /logs, /stats
│   ├── schema.sql          # DB schema (idempotent, runs on startup)
│   └── test/               # API integration tests
└── .env.example            # Environment variable template
```

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (or use PGlite for quick local testing)

### Setup

```bash
# 1. Install dependencies
npm install
npm install --prefix server
npm install --prefix client

# 2. Configure environment variables
cp .env.example .env
```

Set these in `.env`:

| Variable      | Description                                  |
| ------------- | -------------------------------------------- |
| `DATABASE_URL` | Postgres connection string                  |
| `JWT_SECRET`   | Long random string for signing JWTs         |
| `PORT`         | Server port (defaults to 5000)              |

### Run locally

```bash
npm run dev        # starts server + client together
```

- Server: http://localhost:5000
- Client (Vite): the port Vite prints (default 5173)

### Build & test

```bash
npm run build      # type-check + build server and client
npm --prefix server run test   # run API tests
```

## API Overview

| Method | Endpoint         | Description                          |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/api/auth/register` | Create an account                  |
| POST   | `/api/auth/login`    | Log in, returns JWT                |
| GET    | `/api/auth/me`       | Current user (Bearer token)        |
| GET    | `/api/logs`          | List logs (optional `?year=&month=`)|
| POST   | `/api/logs`          | Create a log                       |
| DELETE | `/api/logs/:id`      | Delete a log                       |
| GET    | `/api/stats`         | Monthly + average stats            |
| GET    | `/api/health`        | Health check                       |

All `/api/logs` and `/api/stats` endpoints require a `Authorization: Bearer <token>` header.

## Deployment (Railway)

1. Push the repo to GitHub and connect it in Railway (**New Project → Deploy from GitHub repo**).
2. Add a **PostgreSQL** plugin to the project — Railway auto-creates `DATABASE_URL`.
3. On the app service's **Variables** tab, add:
   - `JWT_SECRET` (long random string)
   - `NODE_ENV=production`
   - `DATABASE_URL` (paste the value from the Postgres service if not shared automatically)
4. On the app service's **Settings → Deploy**, set:
   - Install: `npm install --include=dev && npm install --prefix server --include=dev && npm install --prefix client --include=dev`
   - Build: `npm run build`
   - Start: `npm run start`

The schema is applied automatically on startup (`schema.sql`).
