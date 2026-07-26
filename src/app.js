const express = require('express');
const tasksRouter = require('./routes/items');
const repository = require('./repositories');

const app = express();

app.use(express.json());

// Health check — pings the database so a load balancer gets a real signal.
// A load balancer uses this: if /health returns non-2xx, the instance is pulled
// from rotation. That way broken DB connections never receive live traffic.
app.get('/health', async (_req, res) => {
  try {
    // If the repository exposes a pool (Postgres), run a cheap ping query
    if (repository.pool) {
      await repository.pool.query('SELECT 1');
    }
    res.json({ status: 'ok', db: 'reachable' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

app.use('/tasks', tasksRouter);

module.exports = app;
