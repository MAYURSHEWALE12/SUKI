const crypto = require('crypto');

// PayU field layout shared by both directions. After udf1..udf5 there are 5
// more (empty) parameters, verified empirically against test.payu.in: the
// gateway echoes back the exact 17-field string it hashes for each rejected
// transaction (key|txnid|amount|productinfo|firstname|email|10 empty|salt).
const EMPTY_SLOTS = new Array(10).fill('');

// Forward: sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5|........................|salt)
function computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
  const fields = [key, txnid, amount, productinfo, firstname, email, ...EMPTY_SLOTS, salt];
  return crypto.createHash('sha512').update(fields.join('|')).digest('hex');
}

// Reverse (PayU -> us for payment verification):
// sha512(additionalCharges|salt|status|udf1..udf5|........................|email|firstname|productinfo|amount|txnid|key)
function computeReverseHash({ additionalCharges, salt, status, email, firstname, productinfo, amount, txnid, key }) {
  const prefix = additionalCharges ? [additionalCharges, salt, status] : [salt, status];
  const fields = [...prefix, ...EMPTY_SLOTS, email, firstname, productinfo, amount, txnid, key];
  return crypto.createHash('sha512').update(fields.join('|')).digest('hex');
}

module.exports = { computeForwardHash, computeReverseHash };