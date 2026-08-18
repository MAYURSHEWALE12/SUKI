const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { computeForwardHash, computeReverseHash } = require('../utils/payuHash');

const sha512 = (s) => crypto.createHash('sha512').update(s).digest('hex');

test('forward hash follows the documented 13-field layout', () => {
  const fields = ['gtKFFx', 'order_123', '299.00', 'Test Product', 'John', 'john@example.com', 'a', '', 'c', '', 'e', ...new Array(6).fill(''), 'salt123'];
  const expected = sha512(fields.join('|'));
  const actual = computeForwardHash({
    key: 'gtKFFx',
    txnid: 'order_123',
    amount: '299.00',
    productinfo: 'Test Product',
    firstname: 'John',
    email: 'john@example.com',
    salt: 'salt123',
    udf1: 'a',
    udf3: 'c',
    udf5: 'e',
  });
  assert.strictEqual(actual, expected);
});

test('reverse hash follows the documented 19-field layout with udf in reverse order', () => {
  const fields = ['salt123', 'success', ...new Array(6).fill(''), 'e', '', 'c', '', 'a', 'john@example.com', 'John', 'Test Product', '299.00', 'order_123', 'gtKFFx'];
  const expected = sha512(fields.join('|'));
  const actual = computeReverseHash({
    salt: 'salt123',
    status: 'success',
    email: 'john@example.com',
    firstname: 'John',
    productinfo: 'Test Product',
    amount: '299.00',
    txnid: 'order_123',
    key: 'gtKFFx',
    udf1: 'a',
    udf3: 'c',
    udf5: 'e',
  });
  assert.strictEqual(actual, expected);
});

test('reverse hash prepends additionalCharges only for real nonzero values', () => {
  const base = {
    salt: 'salt123',
    status: 'success',
    email: 'john@example.com',
    firstname: 'John',
    productinfo: 'Test Product',
    amount: '299.00',
    txnid: 'order_123',
    key: 'gtKFFx',
  };
  const chargedFields = ['5.00', 'salt123', 'success', ...new Array(6).fill(''), ...new Array(5).fill(''), 'john@example.com', 'John', 'Test Product', '299.00', 'order_123', 'gtKFFx'];
  const withCharges = computeReverseHash({ ...base, additionalCharges: '5.00' });
  assert.strictEqual(withCharges, sha512(chargedFields.join('|')));

  const plainFields = ['salt123', 'success', ...new Array(6).fill(''), ...new Array(5).fill(''), 'john@example.com', 'John', 'Test Product', '299.00', 'order_123', 'gtKFFx'];
  const plain = computeReverseHash(base);
  assert.strictEqual(plain, sha512(plainFields.join('|')));
  assert.strictEqual(computeReverseHash({ ...base, additionalCharges: '0' }), plain);
  assert.strictEqual(computeReverseHash({ ...base, additionalCharges: '0.00' }), plain);
});