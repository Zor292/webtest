const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

const viewsDir = path.join(__dirname, 'views');
const routes = {
  '/': 'index.html',
  '/shop': 'shop.html',
  '/product': 'product.html',
  '/cart': 'cart.html',
  '/checkout': 'checkout.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/admin': 'admin/dashboard.html',
  '/admin/': 'admin/dashboard.html',
  '/admin/products': 'admin/products.html',
  '/admin/products/new': 'admin/product-form.html',
  '/admin/products/edit': 'admin/product-form.html',
  '/admin/orders': 'admin/orders.html',
  '/admin/users': 'admin/users.html'
};

Object.entries(routes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(viewsDir, file));
  });
});

app.get('/admin/orders/:id', (req, res) => {
  res.sendFile(path.join(viewsDir, 'admin', 'order-detail.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Clothing store running at http://localhost:${PORT}`);
});
