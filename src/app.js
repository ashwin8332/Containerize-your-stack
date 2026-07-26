const express = require('express');
const itemsRouter = require('./routes/items');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/items', itemsRouter);

module.exports = app;
