/**
 * *** THE ONLY FILE THAT CHANGES WHEN YOU SWAP STORAGE ***
 *
 * Switch between implementations by changing the require below.
 * The service and all routes never need to be touched.
 *
 * Option A — Postgres (production / Docker):
 *   const Repository = require('./postgresItemRepository');
 *
 * Option B — In-memory (local dev / tests, no DB needed):
 *   const Repository = require('./inMemoryItemRepository');
 */
const Repository = require('./postgresItemRepository');

module.exports = new Repository();
