const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const Order = require('../models/Order');
const { start, json, form } = require('./helpers');

let ctx;
let userToken;
let adminToken;
let product;
let orderBody;

function mint(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

before(async () => {
  ctx = await start();
});

after(async () => {
  await ctx.stop();
});

beforeEach(async () => {
  await ctx.reset();
  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'adminpass123', role: 'admin' });
  const buyer = await User.create({ name: 'Buyer', email: 'buyer@test.com', password: 'buyerpass123' });
  adminToken = mint(admin);
  userToken = mint(buyer);
  product = await Product.create({
    name: 'Silk Saree', price: 4999, image: '/uploads/saree.jpg', category: 'Sarees',
    description: 'Handloom', brand: 'Suki', countInStock: 100, rating: 0, numReviews: 0,
  });
  orderBody = {
    orderItems: [{ product: product._id, quantity: 2 }],
    shippingAddress: { fullName: 'Buyer', phone: '9876543210', address: 'Test St', city: 'Pune', postalCode: '411001', country: 'India' },
    paymentMethod: 'Credit Card',
  };
});

test('order rejects empty items', async () => {
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, orderItems: [] });
  assert.strictEqual(res.status, 400);
});

test('order rejects invalid quantities', async () => {
  for (const qty of [0, -1, 'abc', 1.5]) {
    const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, orderItems: [{ product: product._id, quantity: qty }] });
    assert.strictEqual(res.status, 400, `quantity ${qty} should be rejected`);
  }
});

test('order rejects unavailable products (countInStock 0)', async () => {
  await Product.findByIdAndUpdate(product._id, { countInStock: 0 });
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody);
  assert.strictEqual(res.status, 400);
});

test('totals are server-authoritative: price from DB, not the client', async () => {
  orderBody.orderItems = [{ product: product._id, quantity: 2, price: 1 }];
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody);
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.itemsPrice, 9998);
  assert.strictEqual(body.orderItems[0].price, 4999);
  assert.strictEqual(body.totalPrice, 9998);
});

test('discount below min order value is rejected', async () => {
  await Discount.create({ code: 'MIN1000', type: 'percentage', value: 10, minOrderValue: 10000, expiryDate: new Date(Date.now() + 86400000) });
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, discountCode: 'min1000' });
  assert.strictEqual(res.status, 400);
});

test('valid percentage discount is applied and reflected in total', async () => {
  await Discount.create({ code: 'SAVE10', type: 'percentage', value: 10, minOrderValue: 0, expiryDate: new Date(Date.now() + 86400000) });
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, discountCode: 'save10' });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.itemsPrice, 9998);
  assert.strictEqual(body.totalPrice, 8998.2);
  assert.strictEqual(body.discountCode, 'SAVE10');
  assert.strictEqual(body.discountAmount, 999.8);
});

test('unknown discount code is rejected', async () => {
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, discountCode: 'NOPE' });
  assert.strictEqual(res.status, 400);
});

test('order is readable with its session token, not without', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const anon = await fetch(`${ctx.base}/api/orders/${created._id}`);
  assert.strictEqual(anon.status, 401);
  const authed = await fetch(`${ctx.base}/api/orders/${created._id}`, { headers: { 'x-session-token': created.sessionToken } });
  assert.strictEqual(authed.status, 200);
});

test('order status update is admin-only', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const asUser = await json('PUT', `${ctx.base}/api/orders/${created._id}/status`, ctx.base, { status: 'Shipped' }, { Authorization: `Bearer ${userToken}` });
  assert.strictEqual(asUser.status, 401);
  const asAdmin = await json('PUT', `${ctx.base}/api/orders/${created._id}/status`, ctx.base, { status: 'Shipped' }, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(asAdmin.status, 200);
});

test('orders list paginates with an envelope when page+limit are given', async () => {
  const a = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const b = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  assert.notStrictEqual(a._id, b._id);
  await Order.updateMany({}, { isPaid: true, status: 'Processing' });

  const res = await fetch(`${ctx.base}/api/orders?page=1&limit=1`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.total, 2);
  assert.strictEqual(body.pages, 2);
  assert.strictEqual(body.page, 1);
  assert.strictEqual(body.data.length, 1);

  const page2 = await (await fetch(`${ctx.base}/api/orders?page=2&limit=1`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(page2.data.length, 1);
  assert.notStrictEqual(page2.data[0]._id, body.data[0]._id);
});

test('orders list still returns a plain array without page params', async () => {
  const res = await fetch(`${ctx.base}/api/orders`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  assert.strictEqual(body.length, 0);
});

test('orders list keyword matches order id or customer name', async () => {
  const a = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody, { Authorization: `Bearer ${userToken}` })).json();
  await Order.updateMany({}, { isPaid: true, status: 'Processing' });
  const byId = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10&keyword=${a._id.substring(0, 8)}`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(byId.total, 1);
  assert.strictEqual(byId.data[0]._id, a._id);
  const byName = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10&keyword=buyer`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(byName.total, 1);
  const noMatch = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10&keyword=zzznope`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(noMatch.total, 0);
  assert.deepStrictEqual(noMatch.data, []);
});

test('failed payu callback writes no debug dump by default and a sanitized one when enabled', async () => {
  const dumpPath = path.join(__dirname, '..', 'payu-debug.json');
  if (fs.existsSync(dumpPath)) fs.unlinkSync(dumpPath);

  const payload = {
    txnid: 'missing-order', status: 'success', hash: 'wrong', amount: '100',
    firstname: 'Buyer', email: 'buyer@test.com', productinfo: 'Silk Saree',
  };

  await form(`${ctx.base}/api/orders/payu-success`, payload);
  assert.ok(!fs.existsSync(dumpPath), 'no debug dump should be written without PAYU_DEBUG=true');

  process.env.PAYU_DEBUG = 'true';
  try {
    await form(`${ctx.base}/api/orders/payu-success`, payload);
    assert.ok(fs.existsSync(dumpPath), 'debug dump should be written with PAYU_DEBUG=true');
    const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    assert.strictEqual(dump.body.txnid, 'missing-order');
    assert.ok(dump.body.email.includes('***'));
    assert.ok(!dump.body.email.includes('buyer@test.com'), 'raw email must not be dumped');
    assert.strictEqual(dump.body.firstname, undefined, 'PII fields must be dropped');
  } finally {
    process.env.PAYU_DEBUG = 'false';
    if (fs.existsSync(dumpPath)) fs.unlinkSync(dumpPath);
  }
});

test('payu-failure only marks an order failed when the callback hash verifies', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const { computeReverseHash } = require('../utils/payuHash');

  const payload = (hash) => ({
    txnid: created._id.toString(), status: 'failure', hash,
    amount: created.totalPrice, productinfo: 'Silk Saree', firstname: 'Buyer', email: 'buyer@test.com',
  });

  // Forged callback without a valid hash must not flip the order
  await form(`${ctx.base}/api/orders/payu-failure`, payload('deadbeef'));
  let order = await Order.findById(created._id);
  assert.strictEqual(order.status, 'Pending Payment');

  // Valid hash (same reverse layout as the success handler) marks it failed
  const validHash = computeReverseHash({ salt: 'test-salt', status: 'failure', email: 'buyer@test.com', firstname: 'Buyer', productinfo: 'Silk Saree', amount: created.totalPrice, txnid: created._id.toString(), key: 'test-key' });
  await form(`${ctx.base}/api/orders/payu-failure`, payload(validHash));
  order = await Order.findById(created._id);
  assert.strictEqual(order.status, 'Payment Failed');

  // A paid order is never demoted to failed
  await Order.findByIdAndUpdate(created._id, { isPaid: true, status: 'Processing' });
  const paidHash = computeReverseHash({ salt: 'test-salt', status: 'failure', email: 'buyer@test.com', firstname: 'Buyer', productinfo: 'Silk Saree', amount: created.totalPrice, txnid: created._id.toString(), key: 'test-key' });
  await form(`${ctx.base}/api/orders/payu-failure`, payload(paidHash));
  order = await Order.findById(created._id);
  assert.strictEqual(order.status, 'Processing');
});

test('order stores the customer email for receipts', async () => {
  const res = await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, email: 'buyer@test.com' });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.email, 'buyer@test.com');
});

test('order status update persists tracking and does not error without SMTP', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await json('PUT', `${ctx.base}/api/orders/${created._id}/status`, ctx.base,
    { status: 'Shipped', trackingLink: 'https://track.example/1' },
    { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'Shipped');
  assert.strictEqual(body.trackingLink, 'https://track.example/1');
});

test('orders list hides pending/failed by default but shows them with includePending', async () => {
  await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody);
  await Order.updateOne({}, { status: 'Pending Payment' });

  const hidden = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(hidden.total, 0);

  const shown = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10&includePending=true`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(shown.total, 1);
  assert.strictEqual(shown.data[0].status, 'Pending Payment');

  const byKeyword = await (await fetch(`${ctx.base}/api/orders?page=1&limit=10&keyword=buyer&includePending=true`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.strictEqual(byKeyword.total, 1);
});

test('payu-hash refuses amounts that do not match the order total', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await json('POST', `${ctx.base}/api/orders/${created._id}/payu-hash`, ctx.base, {
    amount: created.totalPrice - 1, productinfo: 'x', firstname: 'Buyer', email: 'buyer@test.com', phone: '9876543210',
  });
  assert.strictEqual(res.status, 400);
});

test('payu-hash returns a well-formed payload pointing at the test gateway', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await json('POST', `${ctx.base}/api/orders/${created._id}/payu-hash`, ctx.base, {
    amount: created.totalPrice, productinfo: 'Silk Saree', firstname: 'Buyer', email: 'buyer@test.com', phone: '9876543210',
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.gatewayUrl, 'https://test.payu.in/_payment');
  assert.match(body.hash, /^[0-9a-f]{128}$/);
  assert.strictEqual(body.txnid, created._id.toString());
  assert.strictEqual(body.surl, `${ctx.base}/api/orders/payu-success`);
  assert.strictEqual(body.furl, `${ctx.base}/api/orders/payu-failure`);
});

test('tracking rejects invalid order id', async () => {
  const res = await fetch(`${ctx.base}/api/orders/track/not-an-id`);
  assert.strictEqual(res.status, 400);
});

test('tracking requires the order session token for guest orders', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();

  const noToken = await fetch(`${ctx.base}/api/orders/track/${created._id}`);
  assert.strictEqual(noToken.status, 401);

  const wrongToken = await fetch(`${ctx.base}/api/orders/track/${created._id}?token=wrong`);
  assert.strictEqual(wrongToken.status, 401);

  const ok = await (await fetch(`${ctx.base}/api/orders/track/${created._id}?token=${created.sessionToken}`)).json();
  assert.strictEqual(ok._id, created._id.toString());
  assert.strictEqual(ok.status, 'Pending Payment');
  assert.strictEqual(ok.orderItems.length, 1);
  assert.strictEqual(ok.orderItems[0].name, 'Silk Saree');
  assert.strictEqual(ok.shippingAddress, undefined);
  assert.strictEqual(ok.paymentResult, undefined);
});

test('tracking works with x-session-token header and never leaks payment/address data', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await fetch(`${ctx.base}/api/orders/track/${created._id}`, { headers: { 'x-session-token': created.sessionToken } });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.sessionToken, undefined);
  assert.strictEqual(body.shippingAddress, undefined);
  assert.strictEqual(body.paymentResult, undefined);
});

test('tracking grants registered buyers access to their own orders via JWT', async () => {
  const buyer = await User.findOne({ email: 'buyer@test.com' });
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  await Order.findByIdAndUpdate(created._id, { user: buyer._id });
  const res = await fetch(`${ctx.base}/api/orders/track/${created._id}`, { headers: { Authorization: `Bearer ${userToken}` } });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body._id, created._id.toString());
});

test('tracking hides orders from other registered users', async () => {
  const admin = await User.findOne({ email: 'admin@test.com' });
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  await Order.findByIdAndUpdate(created._id, { user: admin._id });
  const res = await fetch(`${ctx.base}/api/orders/track/${created._id}`, { headers: { Authorization: `Bearer ${userToken}` } });
  assert.strictEqual(res.status, 401);
});

test('resume payment refuses without the order session token', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await fetch(`${ctx.base}/api/orders/${created._id}/pay`);
  assert.strictEqual(res.status, 401);
});

test('resume payment renders a PayU auto-submit form with a valid hash', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  const res = await fetch(`${ctx.base}/api/orders/${created._id}/pay?token=${created.sessionToken}`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.match(html, /test\.payu\.in\/_payment/);
  assert.match(html, new RegExp(`name="txnid" value="${created._id}"`));
  assert.match(html, /name="amount" value="9998"/);
  assert.match(html, /name="hash" value="[0-9a-f]{128}"/);

  // The page needs its own permissive CSP (inline auto-submit script + form
  // POST to the PayU origin), overriding helmet's restrictive default.
  const csp = res.headers.get('content-security-policy');
  assert.ok(csp, 'CSP header present');
  assert.match(csp, /script-src 'unsafe-inline'/, 'inline auto-submit script allowed');
  assert.match(csp, /form-action \*/, 'form may POST to the PayU gateway');
});

test('resume payment redirects to success when the order is already paid', async () => {
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, orderBody)).json();
  await Order.findByIdAndUpdate(created._id, { isPaid: true, status: 'Processing' });
  const res = await fetch(`${ctx.base}/api/orders/${created._id}/pay?token=${created.sessionToken}`, { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.match(res.headers.get('location'), /\/success\?orderId=/);
});

test('abandoned-cart reminder only emails unpaid orders older than the cutoff', async () => {
  const { sendAbandonedCartReminders } = require('../utils/abandonedCart');
  const now = new Date('2025-01-15T00:00:00Z');

  const oldOrder = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, email: 'guest@test.com' })).json();
  await Order.collection.updateOne({ _id: new (require('mongoose').Types.ObjectId)(oldOrder._id) }, { $set: { createdAt: new Date('2025-01-10T00:00:00Z') } });

  const freshOrder = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, email: 'fresh@test.com' })).json();

  const oldPaid = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, email: 'paid@test.com' })).json();
  await Order.collection.updateOne({ _id: new (require('mongoose').Types.ObjectId)(oldPaid._id) }, { $set: { createdAt: new Date('2025-01-10T00:00:00Z'), isPaid: true, status: 'Processing' } });

  const sent = await sendAbandonedCartReminders({ hours: 24, now, send: async () => true });
  assert.strictEqual(sent, 1);

  const reminded = await Order.findById(oldOrder._id);
  assert.ok(reminded.abandonedReminderSentAt);

  const second = await sendAbandonedCartReminders({ hours: 24, now, send: async () => true });
  assert.strictEqual(second, 0);
});

test('abandoned-cart email links point at the resume-payment endpoint', async () => {
  const { abandonedCart } = require('../utils/emailTemplates');
  const created = await (await json('POST', `${ctx.base}/api/orders`, ctx.base, { ...orderBody, email: 'guest@test.com' })).json();
  const html = abandonedCart({
    order: created,
    frontendUrl: 'http://localhost:3000',
    payUrl: `http://localhost:3000/api/orders/${created._id}/pay?token=${created.sessionToken}`,
  });
  assert.match(html, /Complete Your Payment/);
  assert.match(html, new RegExp(`http://localhost:3000/api/orders/${created._id}/pay\\?token=${created.sessionToken}`));
});