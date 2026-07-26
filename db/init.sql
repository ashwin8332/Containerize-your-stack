-- Initialisation script — run once when the Postgres container is first created.
-- Mounted via docker-compose into /docker-entrypoint-initdb.d/
-- IF the volume already exists this file is NOT re-run (Postgres behaviour).

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL       PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed three example tasks — only runs on first-ever volume creation
INSERT INTO tasks (title, description, completed) VALUES
  ('Buy groceries',    'Milk, eggs, bread',          FALSE),
  ('Read docs',        'Read the Postgres 16 docs',  FALSE),
  ('Ship W3',          'Containerize the stack',     TRUE);
