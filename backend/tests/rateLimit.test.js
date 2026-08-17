// Rate limiting must be tested in isolation: this file is the only one allowed
// to blow the login budget (10 attempts / 15 min per IP).
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

test('login is rate-limited after 10 rapid attempts', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${ctx.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@test.com', password: 'wrong' }),
    });
    lastStatus = res.status;
  }
  assert.strictEqual(lastStatus, 429);
});