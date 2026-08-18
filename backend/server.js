const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { createApp } = require('./app');

// Load env vars
dotenv.config();

// Ensure the WELCOME10 discount exists so the exit-intent popup code always
// works. Idempotent: only created when missing. Admin can edit/disable later.
async function ensureDefaultDiscounts() {
  try {
    const Discount = require('./models/Discount');
    const existing = await Discount.findOne({ code: 'WELCOME10' });
    if (existing) return;
    await Discount.create({
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderValue: 0,
      isActive: true,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    console.log('Seeded default discount code: WELCOME10 (10% off)');
  } catch (error) {
    console.error('Failed to seed default discount code:', error.message);
  }
}

// Connect to database
connectDB().then(() => ensureDefaultDiscounts());

const app = createApp();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});