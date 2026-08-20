const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { start, json } = require('./helpers');

let ctx;
let adminToken;
let userToken;

// Direct token minting keeps the rate-limited auth endpoints free for the
// dedicated endpoint tests below (the brute-force 429 check lives in rateLimit.test.js).
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
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'adminpass123',
    role: 'admin',
  });
  const buyer = await User.create({
    name: 'Buyer',
    email: 'buyer@test.com',
    password: 'buyerpass123',
  });
  adminToken = mint(admin);
  userToken = mint(buyer);
});

test('register creates a user and never leaks the password hash', async () => {
  const res = await json('POST', `${ctx.base}/api/auth/register`, ctx.base, {
    name: 'New', email: 'new@test.com', password: 'newpass123',
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.ok(body.token);
  assert.strictEqual(body.password, undefined);
});

test('register rejects duplicate email', async () => {
  const res = await json('POST', `${ctx.base}/api/auth/register`, ctx.base, {
    name: 'Copy', email: 'buyer@test.com', password: 'copypass123',
  });
  assert.strictEqual(res.status, 400);
});

test('login with wrong password is rejected', async () => {
  const res = await json('POST', `${ctx.base}/api/auth/login`, ctx.base, {
    email: 'buyer@test.com', password: 'wrongpass',
  });
  assert.strictEqual(res.status, 401);
});

test('login with correct password returns a token', async () => {
  const res = await json('POST', `${ctx.base}/api/auth/login`, ctx.base, {
    email: 'buyer@test.com', password: 'buyerpass123',
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
});

test('profile endpoint requires auth', async () => {
  const anon = await fetch(`${ctx.base}/api/auth/profile`);
  assert.strictEqual(anon.status, 401);
  const auth = await fetch(`${ctx.base}/api/auth/profile`, { headers: { Authorization: `Bearer ${userToken}` } });
  assert.strictEqual(auth.status, 200);
});

test('user list is admin-only', async () => {
  const asUser = await fetch(`${ctx.base}/api/auth/users`, { headers: { Authorization: `Bearer ${userToken}` } });
  assert.strictEqual(asUser.status, 401);
  const asAdmin = await fetch(`${ctx.base}/api/auth/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.strictEqual(asAdmin.status, 200);
});