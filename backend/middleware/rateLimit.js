const rateLimit = require('express-rate-limit');

// Brute-force protection for credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

// Anti-abuse limit for creating orders. Overridable via env so the test suite
// (which issues many order POSTs against one app instance) never trips it.
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.ORDER_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many orders placed. Please try again later.' },
});

// Anti-abuse limit for posting reviews
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reviews. Please try again later.' },
});

// Anti-abuse limit for newsletter signups: every valid submission fires a real
// outbound email, so an unlimited endpoint would turn into an SMTP relay.
const subscriberLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many subscription attempts. Please try again later.' },
});

module.exports = { authLimiter, orderLimiter, reviewLimiter, subscriberLimiter };