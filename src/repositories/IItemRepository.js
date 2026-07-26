/**
 * ITaskRepository — the contract every repository must satisfy.
 * All methods return Promises.
 *
 * @interface
 */
class ITaskRepository {
  /** @returns {Promise<Array>} */
  async findAll() { throw new Error('Not implemented'); }

  /** @param {number} id @returns {Promise<object|null>} */
  async findById(id) { throw new Error('Not implemented'); }

  /** @param {{title: string, description: string, completed: boolean}} data @returns {Promise<object>} */
  async create(data) { throw new Error('Not implemented'); }

  /** @param {number} id @param {object} fields @returns {Promise<object|null>} */
  async update(id, fields) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {Promise<boolean>} */
  async delete(id) { throw new Error('Not implemented'); }
}

module.exports = ITaskRepository;
