const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

function createApp() {
  const app = express();

  // Security headers: clickjacking protection, MIME sniffing, referrer
  // policy, CSP, HSTS, etc. Safe for a JSON API + image static files.
  app.use(helmet({ frameguard: { action: 'deny' } }));

  // Trust the first proxy hop when deployed behind a reverse proxy so rate
  // limits and req.ip see the real client IP. Disable for direct exposure.
  app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

  // Restrict CORS to known frontend origins (comma-separated CORS_ORIGIN env override)
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.FRONTEND_URL && !corsOrigins.includes(process.env.FRONTEND_URL)) {
    corsOrigins.push(process.env.FRONTEND_URL);
  }

  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const { notFound, errorHandler } = require('./middleware/errorMiddleware');

  // Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/discounts', require('./routes/discountRoutes'));
  app.use('/api/homepage', require('./routes/homepageRoutes'));
  app.use('/api/upload', require('./routes/uploadRoutes'));
  app.use('/api/subscribers', require('./routes/subscriberRoutes'));
  app.use('/api/feed', require('./routes/feedRoutes'));

  // Serve uploads folder statically
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

  // Error Middlewares
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };