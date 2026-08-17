// Sandbox acceptance check: posts a forward hash (generated exactly like the
// live controller) to the PayU test gateway. PayU validates the hash server-side
// and returns a payment page only if every field + separator matches its spec.
// Usage: node scripts/payuCheck.js
require('dotenv').config();
const http = require('http');
const https = require('https');
const { computeForwardHash, computeReverseHash } = require('../utils/payuHash');

const key = process.env.PAYU_MERCHANT_KEY;
const salt = process.env.PAYU_MERCHANT_SALT;

if (!key || !salt) {
  console.error('PAYU_MERCHANT_KEY / PAYU_MERCHANT_SALT missing from .env');
  process.exit(1);
}

const txnid = 'payucheck_' + Date.now();
const amount = '299.00';
const productinfo = 'PayU sandbox hash check';
const firstname = 'Suki';
const email = 'check@sukiethnic.com';

const hash = computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt });
console.log('forward hash :', hash);

// Verify the reverse-hash utility syntax on a fake PayU callback too
const reverse = computeReverseHash({ salt, status: 'success', email, firstname, productinfo, amount, txnid, key });
console.log('reverse hash :', reverse.slice(0, 16) + '...');

const body = new URLSearchParams({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  phone: '9876543210',
  surl: 'https://example.com/success',
  furl: 'https://example.com/failure',
  hash,
  pg: 'CC',
}).toString();

const req = https.request(
  {
    hostname: 'test.payu.in',
    path: '/_payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const lower = data.toLowerCase();
      console.log('HTTP status   :', res.statusCode);
      if (res.statusCode === 302) {
        console.log('RESULT: PASS - gateway accepted the hash, redirecting to payment page');
      } else if (lower.includes('hash') || lower.includes('invalid') || lower.includes('failed validation')) {
        console.log('RESULT: FAIL - gateway rejected the hash. Snippet:');
        const idx = lower.indexOf('hash');
        console.log(data.slice(Math.max(0, idx - 200), idx + 400).replace(/\s+/g, ' '));
      } else if (lower.includes('payment options') || lower.includes('card') || lower.includes('netbanking')) {
        console.log('RESULT: PASS - gateway rendered the payment page');
      } else {
        console.log('RESULT: UNKNOWN - digest of page (first 300 chars):');
        console.log(data.replace(/\s+/g, ' ').slice(0, 300));
      }
      process.exit(0);
    });
  }
);
req.on('error', (err) => {
  console.error('RESULT: NETWORK ERROR -', err.message);
  process.exit(1);
});
req.write(body);
req.end();
console.log('posted to     : https://test.payu.in/_payment (txnid=' + txnid + ')');