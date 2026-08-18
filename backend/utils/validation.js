const mongoose = require('mongoose');

const EMAIL_RE = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidEmail = (email) => typeof email === 'string' && EMAIL_RE.test(email);

const isValidPhone = (phone) => typeof phone === 'string' && /^[0-9+\-\s]{7,15}$/.test(phone);

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

module.exports = { isValidObjectId, isValidEmail, isValidPhone, toFiniteNumber };