const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', authorize('admin', 'manager', 'editor'), (req, res) => {
  const productsCount = db.get('products').size().value();
  const ordersCount = db.get('orders').size().value();
  const usersCount = db.get('users').size().value();
  const totalRevenue = db.get('orders').filter({ status: 'delivered' }).sumBy('total').value() || 0;
  const recentOrders = db.get('orders').sortBy('createdAt').reverse().take(5).value().map(o => ({
    id: o.id, total: o.total, status: o.status, createdAt: o.createdAt,
    customer: (db.get('users').find({ id: o.userId }).value() || {}).name || 'Unknown'
  }));
  res.json({ productsCount, ordersCount, usersCount, totalRevenue, recentOrders });
});

router.get('/products', authorize('admin', 'manager', 'editor'), (req, res) => {
  const products = db.get('products').sortBy('createdAt').reverse().value();
  res.json(products);
});

router.post('/products', authorize('admin', 'manager', 'editor'), (req, res) => {
  const { name, description, price, category, image, sizes, colors, stock } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }
  const product = {
    id: uuidv4(),
    name,
    description: description || '',
    price: parseFloat(price),
    category,
    image: image || '/images/placeholder.svg',
    sizes: sizes || [],
    colors: colors || [],
    stock: stock || 0,
    createdAt: new Date().toISOString()
  };
  db.get('products').push(product).write();
  res.status(201).json(product);
});

router.put('/products/:id', authorize('admin', 'manager', 'editor'), (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { name, description, price, category, image, sizes, colors, stock } = req.body;
  const updated = {
    ...product,
    name: name || product.name,
    description: description !== undefined ? description : product.description,
    price: price ? parseFloat(price) : product.price,
    category: category || product.category,
    image: image || product.image,
    sizes: sizes || product.sizes,
    colors: colors || product.colors,
    stock: stock !== undefined ? stock : product.stock
  };
  db.get('products').find({ id: req.params.id }).assign(updated).write();
  res.json(updated);
});

router.delete('/products/:id', authorize('admin', 'manager'), (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  db.get('products').remove({ id: req.params.id }).write();
  res.json({ message: 'Product deleted' });
});

router.get('/orders', authorize('admin', 'manager', 'editor'), (req, res) => {
  const { status } = req.query;
  let orders = db.get('orders').sortBy('createdAt').reverse().value();
  if (status && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }
  const enriched = orders.map(o => ({
    ...o,
    customer: (db.get('users').find({ id: o.userId }).value() || {}).name || 'Unknown'
  }));
  res.json(enriched);
});

router.put('/orders/:id', authorize('admin', 'manager'), (req, res) => {
  const { status } = req.body;
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  db.get('orders').find({ id: req.params.id }).assign({ status }).write();
  res.json({ ...order, status });
});

router.get('/users', authorize('admin'), (req, res) => {
  const users = db.get('users').map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })).value();
  res.json(users);
});

router.put('/users/:id/role', authorize('admin'), (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'editor', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const user = db.get('users').find({ id: req.params.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.get('users').find({ id: req.params.id }).assign({ role }).write();
  res.json({ id: user.id, name: user.name, email: user.email, role });
});

module.exports = router;
