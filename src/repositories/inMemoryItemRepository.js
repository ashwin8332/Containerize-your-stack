const IItemRepository = require('./IItemRepository');

/**
 * In-memory repository — kept for reference and testing.
 * Data is lost on restart (demo only).
 */
class InMemoryItemRepository extends IItemRepository {
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

  async create({ name, description = '' }) {
    const item = { id: this._nextId++, name, description, created_at: new Date() };
    this._store.set(item.id, item);
    return item;
  }

  async update(id, { name, description }) {
    const item = this._store.get(id);
    if (!item) return null;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    return item;
  }

  async delete(id) {
    if (!this._store.has(id)) return false;
    this._store.delete(id);
    return true;
  }
}

module.exports = InMemoryItemRepository;
