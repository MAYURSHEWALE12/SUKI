const crypto = require('crypto');

// PayU India hash layouts (docs.payu.in - "Generate Hash" / "Hashing - Request and Response"):
//   Forward: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
//   Reverse: [additionalCharges|]salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
// The 6 reserved slots (empty after udf5 / after status) must never be omitted.
const RESERVED_SLOTS = new Array(6).fill('');

// Forward: sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5|6 empty|salt)
function computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' }) {
  const fields = [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, ...RESERVED_SLOTS, salt];
  return crypto.createHash('sha512').update(fields.join('|')).digest('hex');
}

// Reverse (PayU -> us for payment verification):
// sha512([additionalCharges|]salt|status|6 empty|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
// additionalCharges is prepended only when it is a real nonzero surcharge
// (PayU omits it otherwise; normalise so "0"/"0.00" can never break the hash).
function computeReverseHash({ additionalCharges, salt, status, email, firstname, productinfo, amount, txnid, key, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' }) {
  const hasCharges = additionalCharges !== undefined && additionalCharges !== null && Number(additionalCharges) !== 0;
  const prefix = hasCharges ? [String(additionalCharges), salt, status] : [salt, status];
  const fields = [...prefix, ...RESERVED_SLOTS, udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key];
  return crypto.createHash('sha512').update(fields.join('|')).digest('hex');
}

module.exports = { computeForwardHash, computeReverseHash };