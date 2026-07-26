const { Pool } = require('pg');
const ITaskRepository = require('./IItemRepository');

/**
 * PostgresTaskRepository — backed by Postgres, parameterized queries only.
 * Implements the same interface as InMemoryTaskRepository.
 * Service and routes are completely unaware of this swap.
 */
class PostgresTaskRepository extends ITaskRepository {
  constructor() {
    super();
    this._pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /** Expose pool so the health-check route can ping the DB */
  get pool() { return this._pool; }

  async findAll() {
    const { rows } = await this._pool.query(
      'SELECT * FROM tasks ORDER BY id ASC'
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await this._pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async create({ title, description = '', completed = false }) {
    const { rows } = await this._pool.query(
      'INSERT INTO tasks (title, description, completed) VALUES ($1, $2, $3) RETURNING *',
      [title, description, completed]
    );
    return rows[0];
  }

  async update(id, { title, description, completed }) {
    // Build a dynamic SET clause — only update fields that were actually sent
    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined)       { updates.push(`title = $${idx++}`);       values.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (completed !== undefined)   { updates.push(`completed = $${idx++}`);   values.push(completed); }

    if (updates.length === 0) return this.findById(id);

    values.push(id); // last placeholder = WHERE id
    const { rows } = await this._pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await this._pool.query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = PostgresTaskRepository;
