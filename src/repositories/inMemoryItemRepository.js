const ITaskRepository = require('./IItemRepository');

/**
 * InMemoryTaskRepository — kept for reference and fast testing (no DB needed).
 * Data is lost on restart.
 */
class InMemoryTaskRepository extends ITaskRepository {
  constructor() {
    super();
    this._store = new Map();
    this._nextId = 1;
  }

  async findAll() {
    return Array.from(this._store.values());
  }

  async findById(id) {
    return this._store.get(id) || null;
  }

  async create({ title, description = '', completed = false }) {
    const task = { id: this._nextId++, title, description, completed, created_at: new Date() };
    this._store.set(task.id, task);
    return task;
  }

  async update(id, { title, description, completed }) {
    const task = this._store.get(id);
    if (!task) return null;
    if (title !== undefined)       task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined)   task.completed = completed;
    return task;
  }

  async delete(id) {
    if (!this._store.has(id)) return false;
    this._store.delete(id);
    return true;
  }
}

module.exports = InMemoryTaskRepository;
