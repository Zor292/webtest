const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./db');

const products = [
  { name: 'Classic White T-Shirt', description: 'Essential cotton crewneck tee. Soft, breathable, and perfect for everyday wear.', price: 29.99, category: 'men', image: '', sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Black', 'Gray'], stock: 150 },
  { name: 'Slim Fit Denim Jacket', description: 'Modern slim-fit denim jacket with a vintage wash. Features button closure and chest pockets.', price: 89.99, category: 'men', image: '', sizes: ['S', 'M', 'L', 'XL'], colors: ['Blue', 'Black'], stock: 75 },
  { name: 'Casual Linen Shirt', description: 'Lightweight linen shirt ideal for warm weather. Relaxed fit with rolled sleeves.', price: 59.99, category: 'men', image: '', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Beige', 'White', 'Navy'], stock: 100 },
  { name: 'Cargo Jogger Pants', description: 'Comfortable joggers with cargo pockets. Elastic waistband with drawstring.', price: 49.99, category: 'men', image: '', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Olive', 'Gray'], stock: 120 },
  { name: 'Floral Maxi Dress', description: 'Beautiful floor-length dress with a vibrant floral print. Adjustable straps and flowy silhouette.', price: 79.99, category: 'women', image: '', sizes: ['XS', 'S', 'M', 'L'], colors: ['Blue Floral', 'Pink Floral'], stock: 60 },
  { name: 'Cashmere Blend Sweater', description: 'Luxuriously soft cashmere blend sweater. Ribbed cuffs and hem. Perfect for layering.', price: 129.99, category: 'women', image: '', sizes: ['S', 'M', 'L', 'XL'], colors: ['Cream', 'Burgundy', 'Charcoal'], stock: 45 },
  { name: 'High-Waist Skinny Jeans', description: 'Flattering high-waist skinny jeans with stretch denim. Five-pocket styling.', price: 69.99, category: 'women', image: '', sizes: ['24', '26', '28', '30', '32'], colors: ['Indigo', 'Black', 'Light Wash'], stock: 90 },
  { name: 'Silk Blouse', description: 'Elegant silk blouse with a hidden button front. Versatile for office or evening.', price: 89.99, category: 'women', image: '', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['White', 'Blush', 'Navy'], stock: 55 },
  { name: 'Kids Graphic Tee', description: 'Fun graphic t-shirt for kids. 100% cotton with vibrant prints.', price: 19.99, category: 'kids', image: '', sizes: ['4T', '5T', '6', '7', '8', '10', '12'], colors: ['Blue', 'Red', 'Green', 'Yellow'], stock: 200 },
  { name: 'Kids Hoodie', description: 'Cozy pullover hoodie with fleece lining. Kangaroo pocket and adjustable hood.', price: 39.99, category: 'kids', image: '', sizes: ['4T', '5T', '6', '7', '8', '10'], colors: ['Gray', 'Navy', 'Pink'], stock: 130 },
  { name: 'Kids Denim Overalls', description: 'Classic denim overalls with adjustable straps. Durable and cute.', price: 44.99, category: 'kids', image: '', sizes: ['12M', '18M', '2T', '3T', '4T'], colors: ['Blue'], stock: 80 },
  { name: 'Kids Sneakers', description: 'Lightweight sneakers with non-slip sole. Velcro closure for easy on/off.', price: 34.99, category: 'kids', image: '', sizes: ['8', '9', '10', '11', '12', '13'], colors: ['White/Blue', 'Black/Red', 'Pink'], stock: 110 },
  { name: 'Leather Crossbody Bag', description: 'Genuine leather crossbody bag with adjustable strap. Multiple compartments.', price: 59.99, category: 'accessories', image: '', sizes: ['One Size'], colors: ['Brown', 'Black', 'Tan'], stock: 65 },
  { name: 'Aviator Sunglasses', description: 'Classic aviator sunglasses with UV400 protection. Gold frame with green lenses.', price: 49.99, category: 'accessories', image: '', sizes: ['One Size'], colors: ['Gold/Green', 'Silver/Blue', 'Black/Gray'], stock: 85 },
  { name: 'Wool Blend Scarf', description: 'Soft wool blend scarf with fringe details. Perfect for cold weather.', price: 34.99, category: 'accessories', image: '', sizes: ['One Size'], colors: ['Camel', 'Gray', 'Navy', 'Burgundy'], stock: 95 },
  { name: 'Canvas Belt', description: 'Durable canvas belt with brass buckle. Reversible design.', price: 24.99, category: 'accessories', image: '', sizes: ['S', 'M', 'L'], colors: ['Olive', 'Navy', 'Black'], stock: 120 }
];

const adminUser = {
  id: uuidv4(),
  name: 'Admin',
  email: 'admin@urbanthreads.com',
  password: bcrypt.hashSync('admin123', 10),
  role: 'admin',
  createdAt: new Date().toISOString()
};

const existingAdmin = db.get('users').find({ email: 'admin@urbanthreads.com' }).value();
if (!existingAdmin) {
  db.get('users').push(adminUser).write();
  console.log('Admin user created: admin@urbanthreads.com / admin123');
}

products.forEach(p => {
  const existing = db.get('products').find({ name: p.name }).value();
  if (!existing) {
    db.get('products').push({ id: uuidv4(), ...p, createdAt: new Date().toISOString() }).write();
  }
});

console.log(`Seeded ${products.length} products.`);
console.log('Done! Run: npm start');
