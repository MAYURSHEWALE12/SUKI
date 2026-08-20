const Order = require('../models/Order');
const sendEmail = require('./sendEmail');
const { abandonedCart } = require('./emailTemplates');

// Finds orders that were created but never paid, older than `hours`, and sends
// one reminder email per order (guarded by abandonedReminderSentAt so a single
// order never receives more than one). `send` is injectable for tests.
async function sendAbandonedCartReminders({ hours = 24, now = new Date(), limit = 100, send = sendEmail } = {}) {
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const orders = await Order.find({
    status: { $in: ['Pending Payment', 'Payment Failed'] },
    email: { $exists: true, $ne: '' },
    abandonedReminderSentAt: null,
    createdAt: { $lte: cutoff },
  }).limit(limit);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  let sent = 0;

  for (const order of orders) {
    const payUrl = `${frontendUrl}/api/orders/${order._id}/pay?token=${encodeURIComponent(order.sessionToken || '')}`;
    const ok = await send({
      email: order.email,
      subject: `Complete Your Order — Suki Ethnic #${order._id.toString().substring(0, 8).toUpperCase()}`,
      html: abandonedCart({ order, frontendUrl, payUrl }),
    });
    if (ok) {
      order.abandonedReminderSentAt = now;
      await order.save();
      sent += 1;
    }
  }

  return sent;
}

module.exports = { sendAbandonedCartReminders };