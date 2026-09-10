const express = require('express');
const { SOURCE_CATALOG, DESTINATION_CATALOG, getSourceSpec, getDestinationSpec } = require('../connectors/catalog');

const router = express.Router();

router.get('/sources', (req, res) => {
  const { category, search } = req.query;
  let list = SOURCE_CATALOG;

  if (category && category !== 'all') {
    list = list.filter(c => c.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }

  res.json(list);
});

router.get('/sources/:id/spec', (req, res) => {
  const item = getSourceSpec(req.params.id);
  if (!item) return res.status(404).json({ error: 'Source not found' });
  res.json(item);
});

router.get('/destinations', (req, res) => {
  const { category, search } = req.query;
  let list = DESTINATION_CATALOG;

  if (category && category !== 'all') {
    list = list.filter(c => c.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }

  res.json(list);
});

router.get('/destinations/:id/spec', (req, res) => {
  const item = getDestinationSpec(req.params.id);
  if (!item) return res.status(404).json({ error: 'Destination not found' });
  res.json(item);
});

module.exports = router;
