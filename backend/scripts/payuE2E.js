// Sandbox E2E sanity check (server-to-server simulation of the PayU callback):
//   1. create an order exactly like the frontend does (POST /api/orders)
//   2. fetch the PayU hash (POST /api/orders/:id/payu-hash)
//   3. build the callback payload exactly as test.payu.in builds it (reverse hash)
//   4. POST it to /api/orders/payu-success and assert the redirect + isPaid flip
// Requires the backend to be reachable at API_BASE and .env loaded.
// Usage: node scripts/payuE2E.js
require('dotenv').config();
const mongoose = require('mongoose');
const { computeReverseHash } = require('../utils/payuHash');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

(async () => {
  const products = await (await fetch(`${API_BASE}/api/products`)).json();
  const product = products[0];
  if (!product) throw new Error('No products in the shop - seed the DB first');
  console.log('using product:', product.name, '| price', product.price);

  const orderRes = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderItems: [{ product: product._id, quantity: 1 }],
      shippingAddress: { fullName: 'E2E Tester', phone: '9876543210', address: 'Test St 1', city: 'Pune', postalCode: '411001', country: 'India' },
      paymentMethod: 'Credit Card',
    }),
  });
  if (!orderRes.ok) throw new Error(`order create failed: ${orderRes.status} ${await orderRes.text()}`);
  const order = await orderRes.json();
  console.log('order created:', order._id, '| total', order.totalPrice, '| token', order.sessionToken.slice(0, 8) + '...');

  const hashRes = await fetch(`${API_BASE}/api/orders/${order._id}/payu-hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: order.totalPrice,
      productinfo: 'E2E sandbox check order',
      firstname: 'Suki',
      email: 'e2e@sukiethnic.com',
      phone: '9876543210',
    }),
  });
  if (!hashRes.ok) throw new Error(`payu-hash failed: ${hashRes.status} ${await hashRes.text()}`);
  const payu = await hashRes.json();
  console.log('gatewayUrl:', payu.gatewayUrl);
  console.log('surl      :', payu.surl);
  console.log('furl      :', payu.furl);
  if (payu.gatewayUrl !== 'https://test.payu.in/_payment') throw new Error('PAYU_ENV must be "test" for this check');

  const reverseHash = computeReverseHash({
    salt: process.env.PAYU_MERCHANT_SALT,
    status: 'success',
    email: payu.email,
    firstname: payu.firstname,
    productinfo: payu.productinfo,
    amount: String(payu.amount),
    txnid: payu.txnid,
    key: process.env.PAYU_MERCHANT_KEY,
  });

  const callback = new URLSearchParams({
    txnid: payu.txnid,
    mihpayid: '4039937155818178',
    status: 'success',
    hash: reverseHash,
    amount: String(payu.amount),
    productinfo: payu.productinfo,
    firstname: payu.firstname,
    email: payu.email,
    bank_ref_num: 'E2E',
  });

  const cbRes = await fetch(`${API_BASE}/api/orders/payu-success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: callback.toString(),
    redirect: 'manual',
  });
  const location = cbRes.headers.get('location') || '';
  console.log('callback status:', cbRes.status, '| redirect to:', location);
  if (cbRes.status !== 302 || !location.includes(`/success?orderId=${payu.txnid}`)) {
    throw new Error(`SANITY FAIL - unexpected callback response (got ${cbRes.status})`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const Order = require('../models/Order');
  const after = await Order.findById(payu.txnid);
  console.log('order.isPaid:', after.isPaid, '| paidAt:', after.paidAt ? 'set' : 'unset');
  if (!after.isPaid) throw new Error('SANITY FAIL - order was not marked paid');
  await mongoose.disconnect();

  console.log('E2E PASS - hash, reverse-hash, webhook, redirect and isPaid all verified');
})().catch((err) => {
  console.error('E2E FAIL -', err.message);
  process.exit(1);
});