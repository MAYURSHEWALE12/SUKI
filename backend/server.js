const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { createApp } = require('./app');
const { sendAbandonedCartReminders } = require('./utils/abandonedCart');

// Load env vars
dotenv.config();

// Fail fast on weak/missing JWT secret before the server accepts traffic.
const { assertSafeEnv } = require('./utils/envGuard');
assertSafeEnv();

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
connectDB().then(() => {
  ensureDefaultDiscounts();

  // Abandoned-cart reminder sweep: runs every ABANDONED_CART_INTERVAL_MIN
  // minutes and emails orders unpaid for more than ABANDONED_CART_HOURS.
  // Disable entirely with ABANDONED_CART_ENABLED=false.
  if (process.env.ABANDONED_CART_ENABLED !== 'false') {
    const intervalMin = Number(process.env.ABANDONED_CART_INTERVAL_MIN || 60);
    const hours = Number(process.env.ABANDONED_CART_HOURS || 24);
    const sweep = async () => {
      try {
        const sent = await sendAbandonedCartReminders({ hours });
        if (sent > 0) console.log(`Abandoned-cart reminders sent: ${sent}`);
      } catch (error) {
        console.error('Abandoned-cart sweep failed:', error.message);
      }
    };
    setInterval(sweep, intervalMin * 60 * 1000);
    sweep();
  }
});

const app = createApp();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});