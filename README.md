# W3 — Containerized Stack

Express API + PostgreSQL + Redis, all wired up with Docker Compose.

---

## What this is and why it was built

This project is **Week 3 (A3) of the FlyRank Backend Internship Track**. Each week builds on the last. W3 has one specific job: take the layered Express API from A1/A2 (which stored data in memory) and make it real — persistent data in Postgres, a proper containerized environment, and a stack anyone can spin up with one command.

### The intent

Prove a single architectural claim from A2: **"switching storage changes only one file."** That claim is easy to make with in-memory storage. A3 stress-tests it by wiring in a real Postgres database and confirming that nothing else in the codebase changed.

Beyond that, A3 establishes the local development foundation every later week depends on:
- W4 (jobs / queues) needs a persistent database and Redis already in the stack.
- W5 (caching / RAG) assumes Redis is running.
- Every week from here assumes data survives a restart — the project is no longer a demo.

### The goal

1. Run Postgres in Docker with a named volume so data is not lost when containers stop.
2. Connect the app to Postgres by swapping the in-memory repository for a real SQL one — without touching the service layer or routes.
3. Manage secrets properly — connection string in `.env` (gitignored), `.env.example` committed.
4. Start everything with one command: `docker compose up`.
5. Prove persistence — create rows, `docker compose down`, `docker compose up`, rows still there.

### What was specifically built

| Piece | What it does |
|---|---|
| `src/repositories/IItemRepository.js` | Interface every repository must satisfy — `findAll`, `findById`, `create`, `update`, `delete` |
| `src/repositories/inMemoryItemRepository.js` | Original A1/A2 store — kept for reference and fast local testing |
| `src/repositories/postgresItemRepository.js` | Real Postgres implementation using `pg` — parameterized queries, connection pool, dynamic UPDATE |
| `src/repositories/index.js` | **The only file that changed** to swap storage |
| `src/services/itemService.js` | Business logic — untouched during the swap |
| `src/routes/items.js` | HTTP CRUD routes — untouched during the swap |
| `db/init.sql` | Creates `tasks` table (`IF NOT EXISTS`) and seeds 3 rows on first volume creation |
| `docker-compose.yml` | Postgres + Node app + Redis; healthcheck gates app startup |
| `Dockerfile` | Multi-stage build (deps → runtime), non-root user |
| `.env` / `.env.example` | `.env` gitignored; `.env.example` committed as template |

### The architectural payoff

`TaskService` calls `this.repository.findAll()` — no idea whether that hits a `Map` in memory or a Postgres `SELECT`. When storage was swapped:

- `src/services/itemService.js` — **not touched**
- `src/routes/items.js` — **not touched**
- `src/repositories/index.js` — **one line changed**

Same behaviour across three storage engines proves storage is "just an implementation detail." A15 (Layered Architecture) formalizes exactly this pattern.

---

## One-command run

```bash
cp .env.example .env
docker compose up --build
```

Postgres starts first (healthcheck gated), then the app. API is live at `http://localhost:3001`.

---

## Endpoint table

| Method | Path          | Body                                              | Success | Error         |
|--------|---------------|---------------------------------------------------|---------|---------------|
| GET    | /health       | —                                                 | 200     | 503           |
| GET    | /tasks        | —                                                 | 200     | —             |
| GET    | /tasks/:id    | —                                                 | 200     | 404           |
| POST   | /tasks        | `{ "title": "", "description": "", "completed": false }` | 201 | 400, 404 |
| PUT    | /tasks/:id    | `{ "title": "", "description": "", "completed": true }` | 200 | 400, 404 |
| DELETE | /tasks/:id    | —                                                 | 204     | 404           |

All errors return `{ "error": "<message>" }`.

---

## curl -i output

```
$ curl -i -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New task","description":"test","completed":false}'

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":6,"title":"New task","description":"test","completed":false,"created_at":"2026-07-26T13:34:49.809Z"}

$ curl -i http://localhost:3001/tasks/999

HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"Task not found"}

$ curl -i -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{}'

HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"error":"title is required"}

$ curl -i -X DELETE http://localhost:3001/tasks/3

HTTP/1.1 204 No Content

$ curl -i http://localhost:3001/health

HTTP/1.1 200 OK
{"status":"ok","db":"reachable"}
```

---

## Persistence proof

```bash
# 1. Create a task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"survives restart"}'
# → {"id":7,"title":"survives restart",...}

# 2. Full stop — removes containers but NOT the named volume
docker compose down

# 3. Start again from scratch
docker compose up

# 4. Task is still there
curl http://localhost:3001/tasks
# → [..., {"id":7,"title":"survives restart",...}]  ✓
```

Data survives because Postgres writes to the `postgres_data` named volume which lives on the host, outside the container lifecycle.

---

## Database schema

`db/init.sql` runs automatically on first container creation via `/docker-entrypoint-initdb.d/`. On subsequent starts (volume already exists) it is skipped — so seed data is never duplicated.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL       PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO tasks (title, description, completed) VALUES
  ('Buy groceries',  'Milk, eggs, bread',         FALSE),
  ('Read docs',      'Read the Postgres 16 docs',  FALSE),
  ('Ship W3',        'Containerize the stack',     TRUE);
```

> **Screenshot placeholder** — run `docker compose exec db psql -U postgres -d appdb -c "SELECT * FROM tasks;"` to see all rows directly in the database.

---

## Health check & load balancers

`GET /health` runs `SELECT 1` against Postgres before responding:

```json
{ "status": "ok", "db": "reachable" }
```

If the DB is down it returns `503`. A load balancer polls `/health` on a short interval — if it gets a non-2xx back, it pulls that instance from rotation so no live traffic hits a broken connection.

---

## Multi-stage Dockerfile & image size

The Dockerfile uses two stages:

```
Stage 1 (deps)    — node:20-alpine, installs only production deps via npm ci
Stage 2 (runtime) — node:20-alpine, copies node_modules + src, runs as non-root
```

| | Size |
|---|---|
| Single-stage (with devDependencies + build tools) | ~180 MB |
| Multi-stage final image | **139 MB** |

The savings come from never copying the build toolchain into the runtime image.

---

## Redis (stretch goal — W4 preview)

Redis is in `docker-compose.yml`, starts alongside Postgres every time:

```bash
docker compose exec redis redis-cli ping
# → PONG
```

Full caching integration is W4. Including it here means the W4 starting point is already running.

---

## Environment variables

| Variable       | Example                                      | Required          |
|----------------|----------------------------------------------|-------------------|
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/appdb` | Yes               |
| `PORT`         | `3000`                                       | No (default 3000) |

`.env` is gitignored. `.env.example` is the committed template. No credentials are hardcoded anywhere in source.

---

## Useful commands

```bash
docker compose up --build          # build and start everything
docker compose up -d               # start in background
docker compose down                # stop (data persists in volume)
docker compose down -v             # stop AND delete volumes — wipes all data
docker compose logs -f app         # tail app logs
docker compose exec db psql -U postgres -d appdb    # Postgres shell
docker compose exec redis redis-cli                 # Redis shell
```
