# W3 — Containerized Stack

Express API + PostgreSQL + Redis, all wired up with Docker Compose.

---

## What this is and why it was built

This project is **Week 3 of a progressive backend engineering curriculum**. Each week builds on the last, and W3 has one specific job: take the layered Express API from Week 2 (which stored data in memory) and make it real — persistent data, a proper database, and a reproducible local environment anyone can spin up with one command.

### The intent

The intent is to prove a single architectural claim from Week 2: **"switching storage should change only one file."** That claim is easy to make when everything is in memory. W3 forces you to actually test it by swapping in a real Postgres database and verifying that nothing else in the codebase had to change.

Beyond that, W3 establishes the local development foundation that every later week depends on:
- Week 4 (jobs / queues) needs a persistent database and Redis already running.
- Week 5 (caching / RAG) assumes Redis is in the stack.
- Every week from here on assumes data survives a restart — i.e., your project is no longer a demo.

### The goal

1. **Run Postgres in Docker** with a named volume so data is not lost when containers stop.
2. **Connect the app to Postgres** by swapping the in-memory repository for a real SQL one — without touching the service layer or routes.
3. **Manage secrets properly** — connection string lives in `.env` (gitignored), with `.env.example` committed so anyone cloning the repo knows what variables are needed.
4. **Start everything with one command** — `docker compose up` brings up the database, the app, and Redis together, in the right order (healthcheck gated).
5. **Prove persistence** — create rows, restart both the app and the database container, confirm the rows are still there.

### What was specifically built

| Piece | What it does |
|---|---|
| `src/repositories/IItemRepository.js` | The interface (contract) every repository must satisfy — `findAll`, `findById`, `create`, `update`, `delete` |
| `src/repositories/inMemoryItemRepository.js` | The original Week 2 store — kept in the codebase for reference and fast local testing without Docker |
| `src/repositories/postgresItemRepository.js` | The real Postgres implementation using `node-postgres` (`pg`) — parameterized queries, connection pool, dynamic UPDATE |
| `src/repositories/index.js` | The single wiring file — **the only file that changed** to swap storage |
| `src/services/itemService.js` | Business logic — untouched during the swap, proves the layer boundary holds |
| `src/routes/items.js` | HTTP CRUD routes — untouched during the swap |
| `db/init.sql` | Creates the `items` table and seeds two rows on first container boot |
| `docker-compose.yml` | Orchestrates Postgres + the Node app + Redis; Postgres healthcheck gates the app startup |
| `Dockerfile` | Two-stage build (deps → runtime), non-root user |
| `.env` / `.env.example` | Secrets management — `.env` is gitignored, `.env.example` is the committed template |

### The architectural payoff (why this matters)

The repository pattern creates a hard boundary between "how the app thinks about data" and "where the data actually lives." `ItemService` calls `this.repository.findAll()` — it has no idea whether that hits a `Map` in memory or a Postgres `SELECT`. When the storage layer was swapped:

- `src/services/itemService.js` — **not touched**
- `src/routes/items.js` — **not touched**
- `src/repositories/index.js` — **one line changed** (the `require`)

That is the architecture proving itself. It is not an academic exercise — it is the same pattern used when migrating between databases, adding a read replica, or swapping a third-party API for an internal one.

---

## Quick start

```bash
# 1. Copy env template
cp .env.example .env

# 2. Start everything — Postgres, app, Redis, all at once
docker compose up --build

# 3. Hit the API
curl http://localhost:3000/health
curl http://localhost:3000/items
```

---

## Architecture

```
src/
  index.js                          ← entry point, loads .env
  app.js                            ← Express setup
  routes/items.js                   ← HTTP layer — never touches storage
  services/itemService.js           ← business logic — never touches storage
  repositories/
    IItemRepository.js              ← interface / contract
    inMemoryItemRepository.js       ← in-memory impl (no DB required)
    postgresItemRepository.js       ← Postgres impl
    index.js                        ← *** THE ONLY FILE THAT CHANGED ***
```

---

## API

| Method | Path         | Body                                    | Description     |
|--------|--------------|-----------------------------------------|-----------------|
| GET    | /health      | —                                       | Health check    |
| GET    | /items       | —                                       | List all items  |
| GET    | /items/:id   | —                                       | Get one item    |
| POST   | /items       | `{ "name": "", "description": "" }`     | Create item     |
| PUT    | /items/:id   | `{ "name": "", "description": "" }`     | Update item     |
| DELETE | /items/:id   | —                                       | Delete item     |

---

## Environment variables

| Variable       | Example                                      | Required          |
|----------------|----------------------------------------------|-------------------|
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/appdb` | Yes               |
| `PORT`         | `3000`                                       | No (default 3000) |

`.env` is gitignored. `.env.example` is committed as a template.

---

## Persistence proof

Here is exactly how persistence was verified:

```bash
# 1. Start the stack
docker compose up --build -d

# 2. Create a row
curl -s -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name":"survives restart","description":"persistence test"}'
# → {"id":3,"name":"survives restart","description":"persistence test",...}

# 3. Hard restart — app container + database container both stop and start
docker compose restart

# 4. Row is still there
curl -s http://localhost:3000/items
# → [..., {"id":3,"name":"survives restart",...}]  ✓
```

Data survives because Postgres writes to the `postgres_data` named volume, which lives on the host outside the container lifecycle. Stopping or restarting a container does not touch the volume.

---

## Redis (stretch goal — W4 preview)

Redis is included in `docker-compose.yml`. It starts alongside Postgres and the app every time. Ping it to confirm it's alive:

```bash
# From your host
docker compose exec redis redis-cli ping
# → PONG

# From inside the app container
docker compose exec app sh -c "nc -zv redis 6379"
# → redis (172.x.x.x:6379) open
```

Redis is not wired into the application code yet — that happens in Week 4 when the caching layer is added. Including it here means the W4 starting point is already running.

---

## Database schema

Schema lives in `db/init.sql`. Postgres runs it automatically on first container creation via `/docker-entrypoint-initdb.d/`.

```sql
CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## Useful commands

```bash
docker compose up --build        # build images and start everything
docker compose up -d             # start in background
docker compose down              # stop containers (data persists in volume)
docker compose down -v           # stop AND delete volumes — wipes all data
docker compose logs -f app       # tail app logs
docker compose exec db psql -U postgres -d appdb   # open a Postgres shell
docker compose exec redis redis-cli                # open a Redis shell
```
