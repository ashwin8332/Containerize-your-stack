/**
 * ItemService — pure business logic, zero knowledge of storage.
 * Depends on a repository that satisfies the IItemRepository interface.
 * Swapping storage means changing only src/repositories/index.js — this file never changes.
 */
class ItemService {
  /**
   * @param {import('../repositories/IItemRepository')} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    return this.repository.findById(id);
  }

  async create({ name, description = '' }) {
    return this.repository.create({ name, description });
  }

  async update(id, fields) {
    return this.repository.update(id, fields);
  }

  async remove(id) {
    return this.repository.delete(id);
  }
}

module.exports = ItemService;
