const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
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

// Serve uploads folder statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
