const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { start } = require('./helpers');

let ctx;

before(async () => {
  ctx = await start();
});

after(async () => {
  await ctx.stop();
});

test('API responds with security headers', async () => {
  const res = await fetch(`${ctx.base}/api/products`);
  assert.strictEqual(res.status, 200);

  assert.strictEqual(res.headers.get('x-frame-options'), 'DENY', 'clickjacking protection');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff', 'MIME sniffing protection');
  assert.ok(res.headers.get('strict-transport-security'), 'HSTS present');
  assert.ok(res.headers.get('content-security-policy'), 'CSP present');
  assert.strictEqual(res.headers.get('referrer-policy'), 'no-referrer', 'referrer policy');
});

test('subscriber signup is rate-limited', async () => {
  const res = await fetch(`${ctx.base}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rate@test.com' }),
  });
  assert.strictEqual(res.status, 201);

  for (let i = 0; i < 10; i++) {
    await fetch(`${ctx.base}/api/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `rate${i}@test.com` }),
    });
  }

  const blocked = await fetch(`${ctx.base}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'blocked@test.com' }),
  });
  assert.strictEqual(blocked.status, 429);
});