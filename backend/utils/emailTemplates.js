// Shared HTML email templates for Suki Ethnic. All templates return a full
// HTML body; sendEmail() in utils/sendEmail.js handles delivery.
// Amounts are formatted in Indian Rupees.

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shell(title, body) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
    <div style="background: #D81B60; color: #fff; text-align: center; padding: 28px 16px;">
      <div style="font-size: 30px; letter-spacing: 3px; text-transform: lowercase; font-weight: 400;">suki</div>
      <div style="font-size: 12px; letter-spacing: 10px; margin-top: 2px;">ETHNIC</div>
    </div>
    <div style="padding: 32px 24px; border: 1px solid #f0f0f0; border-top: none;">
      <h1 style="font-size: 20px; color: #111; margin: 0 0 16px;">${escapeHtml(title)}</h1>
      ${body}
    </div>
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      Suki Ethnic &bull; Thank you for shopping with us.<br/>
      Questions? Reply to this email and we will help.
    </div>
  </div>`;
}

function orderItemsTable(orderItems) {
  const rows = orderItems
    .map((item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5; color: #333;">${escapeHtml(item.name)} &times; ${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5; text-align: right; color: #333;">${formatINR(item.price * item.quantity)}</td>
      </tr>`)
    .join('');
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${rows}
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #111;">Total</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #D81B60;">${formatINR(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</td>
      </tr>
    </table>`;
}

function ctaButton(label, url) {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${escapeHtml(url)}" style="display: inline-block; background: #D81B60; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px;">${escapeHtml(label)}</a>
    </div>`;
}

// 1 & 2. Order placed (receipt) / payment confirmed
function orderReceipt({ order, frontendUrl }) {
  const orderLink = `${frontendUrl}/success?orderId=${order._id}`;
  const body = `
    <p style="color: #555; font-size: 14px; line-height: 1.6;">Thank you for your order! Your order has been received and is being prepared.</p>
    <div style="background: #fafafa; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #333;">
      <strong>Order #${String(order._id).substring(0, 8).toUpperCase()}</strong><br/>
      <span style="color: #777;">${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span><br/>
      <span style="color: #777;">${escapeHtml(order.shippingAddress.fullName)} &bull; ${escapeHtml(order.shippingAddress.city)}</span>
    </div>
    ${orderItemsTable(order.orderItems)}
    <p style="color: #555; font-size: 14px;">Status: <strong>${order.status}</strong></p>
    ${ctaButton('View Order Details', orderLink)}
  `;
  return shell(`Order Confirmed &mdash; #${String(order._id).substring(0, 8).toUpperCase()}`, body);
}

// 3. Payment failed
function paymentFailed({ order, frontendUrl }) {
  const retryLink = `${frontendUrl}/checkout`;
  const body = `
    <p style="color: #555; font-size: 14px; line-height: 1.6;">We could not complete the payment for your order <strong>#${String(order._id).substring(0, 8).toUpperCase()}</strong>.</p>
    <div style="background: #fff5f5; border: 1px solid #fdd; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #b91c1c;">
      No amount was charged to you. Your order is not yet confirmed.
    </div>
    ${orderItemsTable(order.orderItems)}
    ${ctaButton('Try Payment Again', retryLink)}
  `;
  return shell('Payment Not Completed', body);
}

// 4. Order status changed (shipped/delivered etc.)
function orderStatusUpdate({ order, frontendUrl, previousStatus }) {
  const orderLink = `${frontendUrl}/success?orderId=${order._id}`;
  const trackingHtml = order.trackingLink
    ? `<div style="background: #fafafa; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #333;">Track your shipment: <a href="${escapeHtml(order.trackingLink)}" style="color: #D81B60;">${escapeHtml(order.trackingLink)}</a></div>`
    : '';
  const body = `
    <p style="color: #555; font-size: 14px; line-height: 1.6;">Your order <strong>#${String(order._id).substring(0, 8).toUpperCase()}</strong> status changed from <strong>${escapeHtml(previousStatus)}</strong> to <strong>${escapeHtml(order.status)}</strong>.</p>
    ${trackingHtml}
    ${orderItemsTable(order.orderItems)}
    ${ctaButton('View Order Details', orderLink)}
  `;
  return shell(`Order Update: ${order.status}`, body);
}

// 5. Welcome email on registration
function welcome({ name, frontendUrl }) {
  const body = `
    <p style="color: #555; font-size: 14px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">Welcome to Suki Ethnic! Your account is ready. Enjoy exclusive deals and a delightful shopping experience.</p>
    ${ctaButton('Start Shopping', frontendUrl)}
  `;
  return shell('Welcome to Suki Ethnic!', body);
}

// 6. Newsletter subscription confirmation
function newsletterWelcome() {
  const body = `
    <p style="color: #555; font-size: 14px; line-height: 1.6;">You are now subscribed to the Suki Ethnic newsletter. We will keep you posted on new collections, offers and events.</p>
  `;
  return shell('Subscription Confirmed', body);
}

module.exports = { orderReceipt, paymentFailed, orderStatusUpdate, welcome, newsletterWelcome };