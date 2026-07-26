const { Pool } = require('pg');
const IItemRepository = require('./IItemRepository');

/**
 * PostgresItemRepository — production repository backed by Postgres.
 * Implements the same interface as InMemoryItemRepository.
 * The service and routes are completely unaware of this swap.
 */
class PostgresItemRepository extends IItemRepository {
  constructor() {
    super();
    this._pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async findAll() {
    const { rows } = await this._pool.query(
      'SELECT * FROM items ORDER BY id ASC'
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await this._pool.query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async create({ name, description = '' }) {
    const { rows } = await this._pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return rows[0];
  }

  async update(id, { name, description }) {
    // Build dynamic SET clause for only the provided fields
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await this._pool.query(
      `UPDATE items SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await this._pool.query(
      'DELETE FROM items WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = PostgresItemRepository;
