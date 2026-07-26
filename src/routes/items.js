const express = require('express');
const TaskService = require('../services/itemService');
const repository = require('../repositories');

const router = express.Router();
const service = new TaskService(repository);

// GET /tasks
router.get('/', async (_req, res) => {
  try {
    const tasks = await service.getAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await service.getById(Number(req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const task = await service.create({ title, description, completed });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    if (title === undefined && description === undefined && completed === undefined) {
      return res.status(400).json({ error: 'Provide at least one field: title, description, or completed' });
    }
    const task = await service.update(Number(req.params.id), { title, description, completed });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await service.remove(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
