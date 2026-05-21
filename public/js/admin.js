function initAdmin(page) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) { window.location.href = '/login'; return; }
  if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'editor') { window.location.href = '/'; return; }
  if (user.role === 'admin') {
    document.querySelectorAll('[id^="users-nav"]').forEach(el => el.style.display = 'block');
  }
  document.getElementById('admin-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
  if (page === 'dashboard') loadDashboard();
  else if (page === 'products') loadAdminProducts();
  else if (page === 'product-form') loadProductForm();
  else if (page === 'orders') loadAdminOrders();
  else if (page === 'order-detail') loadOrderDetail();
  else if (page === 'users') loadUsers();
}

function loadDashboard() {
  api('/admin/dashboard').then(data => {
    document.getElementById('stat-products').textContent = data.productsCount;
    document.getElementById('stat-orders').textContent = data.ordersCount;
    document.getElementById('stat-users').textContent = data.usersCount;
    document.getElementById('stat-revenue').textContent = `$${data.totalRevenue.toFixed(2)}`;
    const tbody = document.querySelector('#recent-orders tbody');
    tbody.innerHTML = data.recentOrders.map(o => `
      <tr>
        <td>#${o.id.slice(0, 8)}</td>
        <td>${o.customer}</td>
        <td>$${o.total.toFixed(2)}</td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      </tr>`).join('');
  });
}

function loadAdminProducts() {
  const tbody = document.querySelector('#products-table tbody');
  api('/admin/products').then(products => {
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><div class="product-thumb">👕</div></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <a href="/admin/products/edit?id=${p.id}" class="btn btn-secondary" style="padding:4px 12px;font-size:0.85rem;">Edit</a>
          <button class="btn btn-danger" style="padding:4px 12px;font-size:0.85rem;" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>`).join('');
  });
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  api(`/admin/products/${id}`, { method: 'DELETE' })
    .then(() => loadAdminProducts())
    .catch(err => alert(err.error));
}

function loadProductForm() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const form = document.getElementById('product-form');
  const title = document.getElementById('form-title');
  if (id) {
    title.textContent = 'Edit Product';
    api(`/products/${id}`).then(p => {
      document.getElementById('product-id').value = p.id;
      document.getElementById('name').value = p.name;
      document.getElementById('description').value = p.description || '';
      document.getElementById('price').value = p.price;
      document.getElementById('stock').value = p.stock;
      document.getElementById('category').value = p.category;
      document.getElementById('image').value = p.image || '';
      document.getElementById('sizes').value = (p.sizes || []).join(', ');
      document.getElementById('colors').value = (p.colors || []).join(', ');
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      price: parseFloat(document.getElementById('price').value),
      stock: parseInt(document.getElementById('stock').value),
      category: document.getElementById('category').value,
      image: document.getElementById('image').value,
      sizes: document.getElementById('sizes').value.split(',').map(s => s.trim()).filter(Boolean),
      colors: document.getElementById('colors').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    const existingId = document.getElementById('product-id').value;
    const method = existingId ? 'PUT' : 'POST';
    const url = existingId ? `/admin/products/${existingId}` : '/admin/products';
    api(url, { method, body: JSON.stringify(payload) })
      .then(() => { window.location.href = '/admin/products'; })
      .catch(err => { document.getElementById('form-error').textContent = err.error || 'Failed to save'; });
  });
}

function loadAdminOrders() {
  const tbody = document.querySelector('#orders-table tbody');
  const filter = document.getElementById('order-status-filter');
  function fetchOrders() {
    const status = filter ? filter.value : 'all';
    api(`/admin/orders?status=${status}`).then(orders => {
      tbody.innerHTML = orders.map(o => `
        <tr>
          <td><a href="/admin/orders/${o.id}">#${o.id.slice(0, 8)}</a></td>
          <td>${o.customer}</td>
          <td>${o.items.length}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span class="status-badge status-${o.status}">${o.status}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>
            <select class="status-select" data-order-id="${o.id}" onchange="updateOrderStatus(this)">
              <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>`).join('');
    });
  }
  if (filter) filter.addEventListener('change', fetchOrders);
  fetchOrders();
}

function updateOrderStatus(select) {
  const orderId = select.dataset.orderId;
  const status = select.value;
  api(`/admin/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status }) })
    .then(() => { loadAdminOrders(); })
    .catch(err => alert(err.error));
}

function loadOrderDetail() {
  const container = document.getElementById('order-detail-container');
  const idDisplay = document.getElementById('order-id-display');
  const pathParts = window.location.pathname.split('/');
  const orderId = pathParts[pathParts.length - 1];
  if (!container || !orderId || orderId === 'order-detail') { if (container) container.innerHTML = '<p>Order not found.</p>'; return; }
  api(`/admin/orders`).then(orders => {
    const order = orders.find(o => o.id === orderId || o.id.startsWith(orderId));
    if (!order) { container.innerHTML = '<p>Order not found.</p>'; return; }
    if (idDisplay) idDisplay.textContent = `#${order.id.slice(0, 8)}`;
    container.innerHTML = `
      <div class="order-info-grid">
        <div><strong>Customer:</strong> ${order.customer}</div>
        <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
        <div><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></div>
        <div><strong>Total:</strong> $${order.total.toFixed(2)}</div>
      </div>
      ${order.shippingAddress ? `
      <h3>Shipping Address</h3>
      <p>${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.zip} ${order.shippingAddress.phone ? '- ' + order.shippingAddress.phone : ''}</p>
      ` : ''}
      <h3 style="margin-top:24px;">Items</h3>
      <table class="admin-table">
        <thead><tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>${order.items.map(i => `
          <tr><td>${i.name}</td><td>${i.size || '-'}</td><td>${i.color || '-'}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>
        `).join('')}</tbody>
      </table>`;
  });
}

function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  api('/admin/users').then(users => {
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="status-badge">${u.role}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          <select class="role-select" data-user-id="${u.id}" onchange="updateUserRole(this)">
            <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
            <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
      </tr>`).join('');
  });
}

function updateUserRole(select) {
  const userId = select.dataset.userId;
  const role = select.value;
  api(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
    .then(() => alert('Role updated!'))
    .catch(err => alert(err.error));
}
