# Oakville Schools Directory

A data-driven directory of schools in Oakville, Ontario — covering public, Catholic, private, Montessori schools, and daycares.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Start infrastructure
```bash
docker compose up -d postgres redis typesense minio
```

### 2. Install dependencies
```bash
npm install
cd web && npm install && cd ..
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run database migration
```bash
npm run db:migrate
```

### 5. Run crawlers (initial data import)
```bash
npm run crawl:hdsb
npm run crawl:hcdsb
npm run import:private
npm run import:childcare
npm run entity:resolve
```

### 6. Start the API
```bash
npm run dev:api
```

### 7. Start the website
```bash
npm run dev:web
```

Visit http://localhost:3000

## Full Docker Deployment
```bash
docker compose up --build
```

## Architecture

```
Source Registry → Seed Import → Normalization → Entity Resolution
    → Enrichment Queue → Playwright Workers → Database
    → Search Index → Directory Website
```

## Project Structure
```
src/
  api/          Express API server
  crawler/      Source adapters (HDSB, HCDSB, private, childcare)
  db/           Schema, migrations, connection pool
  entity/       Entity resolution (deduplication)
  parser/       Normalization utilities
  scheduler/    Cron-based job scheduler
  workers/      Playwright & enrichment workers
web/            Next.js directory website
```

## Data Sources
| Source | Type | Refresh |
|--------|------|---------|
| HDSB | School board directory | Weekly |
| HCDSB | School board directory | Weekly |
| Ontario Private Schools | Government dataset | Monthly |
| Ontario Child Care Finder | Provincial registry | Daily |

## API Endpoints
- `GET /api/schools` — List schools (supports `type`, `search`, `postal_code`, `grade`, `licensed`, `page`, `limit`)
- `GET /api/schools/:slug` — School detail
- `GET /api/stats` — Aggregate statistics
- `GET /api/metrics` — Crawl metrics
- `GET /api/health` — Health check

## Website Pages
- `/oakville-schools` — All schools
- `/oakville-public-schools` — Public schools
- `/oakville-catholic-schools` — Catholic schools
- `/oakville-private-schools` — Private schools
- `/oakville-montessori-schools` — Montessori schools
- `/oakville-daycares` — Daycares
- `/schools/{slug}` — School detail
