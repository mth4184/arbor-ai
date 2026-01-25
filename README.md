# ArborSoftAI CRM/ERP (MVP)

ArborSoftAI is a tree service CRM/ERP prototype with customer intake, estimates, jobs, scheduling, and billing.

## Stack
- **Backend:** FastAPI + SQLAlchemy + Alembic (SQLite by default)
- **Frontend:** Next.js (App Router) + TypeScript
- **DB:** SQLite file stored in `/data/app.db`

## Local setup
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Boot services:
   ```bash
   docker-compose up --build
   ```
3. Open the app:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/health

The backend container runs migrations on startup. If you need to re-run them:
```bash
docker-compose exec backend alembic upgrade head
```

## Seed demo data
```bash
docker-compose exec backend python -m app.seed
```

This seeds:
- 10 customers, 10 leads, 15 estimates
- 10 jobs, 8 invoices, 5 payments
- 2 crews, 6 equipment assets

Default demo users:
- **admin@arborgold.demo / password123** (admin)
- **office@arborgold.demo / password123** (office)
- **crew@arborgold.demo / password123** (crew)

## Core workflows
- Customer → Estimate (draft/sent/approved/rejected)
- Convert estimate → Job (scheduled/in_progress/completed)
- Complete job → Invoice (unpaid/partial/paid)
- Record payments (partial allowed)

## Tests
```bash
python3 -m pytest backend/tests
```