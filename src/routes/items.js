const express = require('express');
const ItemService = require('../services/itemService');
const repository = require('../repositories');

const router = express.Router();
const service = new ItemService(repository);

// GET /items
router.get('/', async (_req, res) => {
  try {
    const items = await service.getAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await service.getById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /items
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const item = await service.create({ name, description });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /items/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await service.update(Number(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /items/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await service.remove(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
