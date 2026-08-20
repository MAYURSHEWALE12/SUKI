const { test } = require('node:test');
const assert = require('node:assert');
const { assertSafeEnv } = require('../utils/envGuard');

function withEnv(env, fn) {
  const saved = { ...process.env };
  Object.keys(env).forEach((k) => { process.env[k] = env[k]; });
  try {
    fn();
  } finally {
    Object.keys(env).forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  }
}

test('env guard rejects a missing JWT secret', () => {
  withEnv({ JWT_SECRET: '' }, () => {
    assert.throws(() => assertSafeEnv(), /JWT_SECRET is not set/);
  });
});

test('env guard rejects known default secrets', () => {
  for (const bad of ['change_me_in_production', 'supersecretkey_change_me_in_production', 'anything_change_me']) {
    withEnv({ JWT_SECRET: bad }, () => {
      assert.throws(() => assertSafeEnv(), /known default/, `should reject ${bad}`);
    });
  }
});

test('env guard rejects short secrets in production', () => {
  withEnv({ JWT_SECRET: 'short', NODE_ENV: 'production' }, () => {
    assert.throws(() => assertSafeEnv(), /at least 32 characters/);
  });
});

test('env guard allows strong secrets', () => {
  withEnv({ JWT_SECRET: 'x'.repeat(48), NODE_ENV: 'production' }, () => {
    assert.doesNotThrow(() => assertSafeEnv());
  });
  withEnv({ JWT_SECRET: 'dev-secret', NODE_ENV: 'development' }, () => {
    assert.doesNotThrow(() => assertSafeEnv());
  });
});