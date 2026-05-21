const API = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }

function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...options, headers })
    .then(async r => { const data = await r.json(); if (!r.ok) throw data; return data; });
}

function checkAuth() {
  const user = getUser();
  const token = getToken();
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  const userNameLink = document.getElementById('user-name-link');
  const adminLink = document.getElementById('admin-link');
  const cartCount = document.getElementById('cart-count');
  if (user && token) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userNameLink) userNameLink.textContent = `Hi, ${user.name}`;
    if (adminLink) adminLink.style.display = (user.role === 'admin' || user.role === 'manager' || user.role === 'editor') ? 'inline' : 'none';
  }
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; });
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  if (!getToken()) { el.textContent = '0'; return; }
  api('/cart').then(items => { el.textContent = items.reduce((s, i) => s + i.quantity, 0); }).catch(() => { el.textContent = '0'; });
}

function loadFeaturedProducts() {
  const grid = document.getElementById('featured-products');
  if (!grid) return;
  api('/products').then(products => {
    const featured = products.slice(0, 8);
    grid.innerHTML = featured.map(p => productCard(p)).join('');
  }).catch(() => { grid.innerHTML = '<p>Failed to load products.</p>'; });
}

function productCard(p) {
  const imgContent = p.image && p.image !== '/images/placeholder.svg'
    ? `<img src="${p.image}" alt="${p.name}" class="product-image">`
    : `<div class="product-image">👕</div>`;
  return `
    <div class="product-card">
      <a href="/product?id=${p.id}">${imgContent}</a>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3><a href="/product?id=${p.id}">${p.name}</a></h3>
        <div class="product-price">$${p.price.toFixed(2)}</div>
        <button class="btn btn-primary" onclick="quickAdd('${p.id}')">Add to Cart</button>
      </div>
    </div>`;
}

function quickAdd(productId) {
  if (!getToken()) { window.location.href = '/login'; return; }
  api('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) })
    .then(() => { updateCartCount(); alert('Added to cart!'); })
    .catch(err => alert(err.error || 'Failed to add'));
}

function loadShopPage() {
  const grid = document.getElementById('product-list');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  if (!grid) return;
  function fetchProducts() {
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter.value !== 'all') params.set('category', categoryFilter.value);
    if (searchInput && searchInput.value) params.set('search', searchInput.value);
    if (sortFilter && sortFilter.value) params.set('sort', sortFilter.value);
    const query = window.location.search;
    const urlParams = new URLSearchParams(query);
    if (urlParams.get('category')) {
      params.set('category', urlParams.get('category'));
      if (categoryFilter) categoryFilter.value = urlParams.get('category');
    }
    api(`/products?${params.toString()}`).then(products => {
      if (products.length === 0) { grid.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">No products found.</p>'; return; }
      grid.innerHTML = products.map(p => productCard(p)).join('');
    }).catch(() => { grid.innerHTML = '<p>Failed to load products.</p>'; });
  }
  if (searchBtn) searchBtn.addEventListener('click', fetchProducts);
  if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') fetchProducts(); });
  if (categoryFilter) categoryFilter.addEventListener('change', fetchProducts);
  if (sortFilter) sortFilter.addEventListener('change', fetchProducts);
  fetchProducts();
}

function loadProductDetail() {
  const container = document.getElementById('product-container');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { container.innerHTML = '<p>Product not found.</p>'; return; }
  api(`/products/${id}`).then(p => {
    const imgContent = p.image && p.image !== '/images/placeholder.svg'
      ? `<img src="${p.image}" alt="${p.name}" class="product-image-large">`
      : `<div class="product-image-large">👕</div>`;
    const sizesHtml = p.sizes && p.sizes.length ? p.sizes.map(s => `<button class="option-btn" data-value="${s}">${s}</button>`).join('') : '<p>One size</p>';
    const colorsHtml = p.colors && p.colors.length ? p.colors.map(c => `<button class="option-btn" data-value="${c}">${c}</button>`).join('') : '<p>Various</p>';
    container.innerHTML = `
      <div class="product-detail-container">
        <div>${imgContent}</div>
        <div class="product-meta">
          <h1>${p.name}</h1>
          <span class="product-category">${p.category}</span>
          <div class="product-price-large">$${p.price.toFixed(2)}</div>
          <p class="product-description">${p.description || 'No description available.'}</p>
          <div class="option-group">
            <label>Size</label>
            <div class="option-buttons" id="size-options">${sizesHtml}</div>
          </div>
          <div class="option-group">
            <label>Color</label>
            <div class="option-buttons" id="color-options">${colorsHtml}</div>
          </div>
          <div class="quantity-selector">
            <button id="qty-minus">-</button>
            <span id="qty-value">1</span>
            <button id="qty-plus">+</button>
          </div>
          <button class="btn btn-primary" id="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>`;
    let selectedSize = null, selectedColor = null, qty = 1;
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.parentElement.id === 'size-options') selectedSize = btn.dataset.value;
        else selectedColor = btn.dataset.value;
      });
    });
    document.getElementById('qty-minus').addEventListener('click', () => { if (qty > 1) { qty--; document.getElementById('qty-value').textContent = qty; } });
    document.getElementById('qty-plus').addEventListener('click', () => { qty++; document.getElementById('qty-value').textContent = qty; });
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
      if (!getToken()) { window.location.href = '/login'; return; }
      api('/cart', { method: 'POST', body: JSON.stringify({ productId: p.id, size: selectedSize, color: selectedColor, quantity: qty }) })
        .then(() => { updateCartCount(); alert('Added to cart!'); })
        .catch(err => alert(err.error || 'Failed to add'));
    });
  }).catch(() => { container.innerHTML = '<p>Product not found.</p>'; });
}

function loadCart() {
  const content = document.getElementById('cart-content');
  if (!content) return;
  if (!getToken()) { content.innerHTML = '<div class="cart-empty"><h2>Please login to view your cart</h2><a href="/login" class="btn btn-primary">Login</a></div>'; return; }
  api('/cart').then(items => {
    if (items.length === 0) { content.innerHTML = '<div class="cart-empty"><h2>Your cart is empty</h2><a href="/shop" class="btn btn-primary">Start Shopping</a></div>'; return; }
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    content.innerHTML = `
      <div class="cart-items">${items.map(i => `
        <div class="cart-item" data-product-id="${i.productId}">
          <div class="cart-item-image">👕</div>
          <div class="cart-item-info">
            <h3>${i.name}</h3>
            <p>${i.size ? 'Size: ' + i.size : ''} ${i.color ? 'Color: ' + i.color : ''}</p>
          </div>
          <div class="cart-item-price">$${(i.price * i.quantity).toFixed(2)}</div>
          <div class="cart-item-actions">
            <input type="number" value="${i.quantity}" min="1" class="cart-qty" data-product-id="${i.productId}">
            <button class="btn btn-danger btn-sm" onclick="removeFromCart('${i.productId}')">Remove</button>
          </div>
        </div>`).join('')}
      </div>
      <div class="cart-summary">
        <h3>Total: $${total.toFixed(2)}</h3>
        <a href="/checkout" class="btn btn-primary">Proceed to Checkout</a>
      </div>`;
    document.querySelectorAll('.cart-qty').forEach(input => {
      input.addEventListener('change', function() {
        const pid = this.dataset.productId;
        const qty = parseInt(this.value) || 1;
        api(`/cart/${pid}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) })
          .then(() => { loadCart(); updateCartCount(); }).catch(err => alert(err.error));
      });
    });
  }).catch(() => { content.innerHTML = '<p>Error loading cart.</p>'; });
}

function removeFromCart(productId) {
  api(`/cart/${productId}`, { method: 'DELETE' })
    .then(() => { loadCart(); updateCartCount(); })
    .catch(err => alert(err.error));
}

function loadCheckout() {
  const summaryItems = document.getElementById('summary-items');
  const summaryTotal = document.getElementById('summary-total');
  const form = document.getElementById('checkout-form');
  if (!summaryItems) return;
  if (!getToken()) { window.location.href = '/login'; return; }
  api('/cart').then(items => {
    if (items.length === 0) { window.location.href = '/cart'; return; }
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    summaryItems.innerHTML = items.map(i => `<div class="order-summary-item"><span>${i.name} x${i.quantity}</span><span>$${(i.price * i.quantity).toFixed(2)}</span></div>`).join('');
    summaryTotal.textContent = total.toFixed(2);
  });
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const address = document.getElementById('address').value;
      const city = document.getElementById('city').value;
      const zip = document.getElementById('zip').value;
      const phone = document.getElementById('phone').value;
      api('/cart').then(items => {
        const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
        return api('/orders', { method: 'POST', body: JSON.stringify({ items, total, shippingAddress: { address, city, zip, phone } }) });
      }).then(() => {
        alert('Order placed successfully!');
        window.location.href = '/';
      }).catch(err => alert(err.error || 'Failed to place order'));
    });
  }
}
