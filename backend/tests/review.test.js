const { test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const { start, json } = require('./helpers');

let ctx;
let userToken;
let product;

before(async () => {
  ctx = await start();
  const reg = await (await fetch(`${ctx.base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Buyer', email: 'buyer@test.com', password: 'buyerpass123' }),
  })).json();
  userToken = jwt.sign({ id: reg._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  product = await Product.create({
    name: 'Lehenga', price: 8999, image: '/uploads/l.jpg', category: 'Lehengas',
    description: 'Festive', brand: 'Suki', countInStock: 100, rating: 0, numReviews: 0,
  });
  await json('POST', `${ctx.base}/api/orders`, ctx.base, {
    orderItems: [{ product: product._id, quantity: 1 }],
    shippingAddress: { fullName: 'Buyer', phone: '9876543210', address: 'Test St', city: 'Pune', postalCode: '411001', country: 'India' },
    paymentMethod: 'Credit Card',
  }, { Authorization: `Bearer ${userToken}` });
});

after(async () => {
  await ctx.stop();
});

test('reviews require authentication', async () => {
  const res = await json('POST', `${ctx.base}/api/products/${product._id}/reviews`, ctx.base, { rating: 5, comment: 'nice' });
  assert.strictEqual(res.status, 401);
});

test('reviews reject out-of-range ratings', async () => {
  for (const rating of [0, 6]) {
    const res = await json('POST', `${ctx.base}/api/products/${product._id}/reviews`, ctx.base, { rating, comment: 'meh' }, { Authorization: `Bearer ${userToken}` });
    assert.strictEqual(res.status, 400, `rating ${rating} should be rejected`);
  }
});

test('reviews accept a valid rating from a purchaser', async () => {
  const res = await json('POST', `${ctx.base}/api/products/${product._id}/reviews`, ctx.base, { rating: 5, comment: 'gorgeous' }, { Authorization: `Bearer ${userToken}` });
  assert.strictEqual(res.status, 201);
});

test('reviews are refused to non-purchasers', async () => {
  const other = await (await fetch(`${ctx.base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other', email: 'other@test.com', password: 'otherpass123' }),
  })).json();
  const otherToken = jwt.sign({ id: other._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const res = await json('POST', `${ctx.base}/api/products/${product._id}/reviews`, ctx.base, { rating: 5, comment: 'x' }, { Authorization: `Bearer ${otherToken}` });
  assert.strictEqual(res.status, 400);
});

test('reviews reject invalid product ids', async () => {
  const res = await json('POST', `${ctx.base}/api/products/not-an-id/reviews`, ctx.base, { rating: 5, comment: 'x' }, { Authorization: `Bearer ${userToken}` });
  assert.strictEqual(res.status, 400);
});