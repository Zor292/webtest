const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, (req, res) => {
  const { items, total, shippingAddress } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  const order = {
    id: uuidv4(),
    userId: req.user.id,
    items,
    total: total || items.reduce((s, i) => s + i.price * i.quantity, 0),
    status: 'pending',
    shippingAddress: shippingAddress || {},
    createdAt: new Date().toISOString()
  };
  db.get('orders').push(order).write();
  db.get('cart').remove({ userId: req.user.id }).write();
  res.status(201).json(order);
});

router.get('/', authenticate, (req, res) => {
  const orders = db.get('orders').filter({ userId: req.user.id }).sortBy('createdAt').reverse().value();
  res.json(orders);
});

module.exports = router;
