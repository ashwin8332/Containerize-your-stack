-- Initialisation script — run once when the Postgres container is first created.
-- Mounted via docker-compose into /docker-entrypoint-initdb.d/

CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Optional: seed a couple of rows so persistence is easy to verify
INSERT INTO items (name, description) VALUES
  ('First item',  'Created by init script'),
  ('Second item', 'Also seeded at startup');
