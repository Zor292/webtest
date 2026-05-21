const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const cart = db.get('cart').find({ userId: req.user.id }).value();
  res.json(cart ? cart.items : []);
});

router.post('/', authenticate, (req, res) => {
  const { productId, size, color, quantity } = req.body;
  const product = db.get('products').find({ id: productId }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  let cart = db.get('cart').find({ userId: req.user.id }).value();
  if (!cart) {
    const newCart = { id: uuidv4(), userId: req.user.id, items: [] };
    db.get('cart').push(newCart).write();
    cart = newCart;
  }
  const existingIdx = cart.items.findIndex(i => i.productId === productId && i.size === size && i.color === color);
  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += (quantity || 1);
  } else {
    cart.items.push({ productId, size, color, quantity: quantity || 1, name: product.name, price: product.price, image: product.image });
  }
  db.get('cart').find({ userId: req.user.id }).assign({ items: cart.items }).write();
  res.json(cart.items);
});

router.put('/:productId', authenticate, (req, res) => {
  const { quantity } = req.body;
  const cart = db.get('cart').find({ userId: req.user.id }).value();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const item = cart.items.find(i => i.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  item.quantity = quantity;
  if (item.quantity <= 0) {
    cart.items = cart.items.filter(i => i.productId !== req.params.productId);
  }
  db.get('cart').find({ userId: req.user.id }).assign({ items: cart.items }).write();
  res.json(cart.items);
});

router.delete('/:productId', authenticate, (req, res) => {
  const cart = db.get('cart').find({ userId: req.user.id }).value();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  cart.items = cart.items.filter(i => i.productId !== req.params.productId);
  db.get('cart').find({ userId: req.user.id }).assign({ items: cart.items }).write();
  res.json(cart.items);
});

module.exports = router;
