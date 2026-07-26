/**
 * TaskService — pure business logic, zero knowledge of storage.
 * Depends on a repository satisfying ITaskRepository.
 * Swapping storage means changing only src/repositories/index.js — this file never changes.
 */
class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    return this.repository.findById(id);
  }

  async create({ title, description = '', completed = false }) {
    return this.repository.create({ title, description, completed });
  }

  async update(id, fields) {
    return this.repository.update(id, fields);
  }

  async remove(id) {
    return this.repository.delete(id);
  }
}

module.exports = TaskService;
