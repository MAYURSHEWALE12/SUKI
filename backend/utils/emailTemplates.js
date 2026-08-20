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
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
    <div style="background: #ffffff; text-align: center; padding: 35px 20px 25px; border-bottom: 1px solid #f0f0f0;">
      <div style="font-family: Georgia, serif; font-size: 42px; letter-spacing: 2px; text-transform: lowercase; font-weight: 400; color: #C2185B; line-height: 1;">suki</div>
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 8px; margin-top: 6px; color: #666; font-weight: 500;">ETHNIC</div>
    </div>
    <div style="padding: 40px 30px;">
      <h1 style="font-size: 22px; color: #111; margin: 0 0 20px; font-weight: 600;">${escapeHtml(title)}</h1>
      ${body}
    </div>
    <div style="text-align: center; padding: 30px 20px; background: #fafafa; color: #888; font-size: 12px; border-top: 1px solid #f0f0f0;">
      <p style="margin: 0 0 8px;">Suki Ethnic &bull; Wear the trend. Own the moment.</p>
      <p style="margin: 0;">Questions? Reply to this email and we will help.</p>
    </div>
  </div>`;
}

function orderItemsTable(orderItems) {
  const rows = orderItems
    .map((item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #444; font-size: 15px;">${escapeHtml(item.name)} <span style="color: #999; font-size: 13px;">&times; ${item.quantity}</span></td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #111; font-size: 15px; font-weight: 500;">${formatINR(item.price * item.quantity)}</td>
      </tr>`)
    .join('');
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      ${rows}
      <tr>
        <td style="padding: 16px 0 8px; font-weight: 600; color: #111; font-size: 16px;">Total</td>
        <td style="padding: 16px 0 8px; text-align: right; font-weight: 700; color: #C2185B; font-size: 18px;">${formatINR(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</td>
      </tr>
    </table>`;
}

function ctaButton(label, url, isPrimary = true) {
  if (isPrimary) {
    return `<a href="${escapeHtml(url)}" style="display: inline-block; background: #C2185B; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; margin: 8px 4px;">${escapeHtml(label)}</a>`;
  } else {
    return `<a href="${escapeHtml(url)}" style="display: inline-block; background: #ffffff; color: #C2185B; border: 1px solid #C2185B; padding: 11px 27px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; margin: 8px 4px;">${escapeHtml(label)}</a>`;
  }
}

// Public tracking page link. Guest orders carry a session token so the
// customer can view tracking without an account; registered orders fall back
// to login via the track page.
function trackLink(order, frontendUrl) {
  const base = `${frontendUrl}/track?orderId=${order._id}`;
  return order.sessionToken ? `${base}&token=${encodeURIComponent(order.sessionToken)}` : base;
}

// 1 & 2. Order placed (receipt) / payment confirmed
function orderReceipt({ order, frontendUrl }) {
  const orderLink = `${frontendUrl}/success?orderId=${order._id}`;
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Thank you for your order! Your order has been received and is being prepared.</p>
    
    <div style="background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 6px; padding: 16px; margin: 0 0 24px; font-size: 14px; color: #333;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding-bottom: 8px; color: #777;">Order Number:</td>
          <td style="padding-bottom: 8px; text-align: right; font-weight: 600;">#${String(order._id).substring(0, 8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #777;">Order Date:</td>
          <td style="padding-bottom: 8px; text-align: right; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="color: #777;">Shipping To:</td>
          <td style="text-align: right; font-weight: 600;">${escapeHtml(order.shippingAddress.fullName)}</td>
        </tr>
      </table>
    </div>

    ${orderItemsTable(order.orderItems)}
    
    <div style="margin: 32px 0 0; text-align: center;">
      ${ctaButton('Track Order', trackLink(order, frontendUrl), true)}
      ${ctaButton('View Details', orderLink, false)}
    </div>
  `;
  return shell(`Order Confirmed &mdash; #${String(order._id).substring(0, 8).toUpperCase()}`, body);
}

// 3. Payment failed
function paymentFailed({ order, frontendUrl }) {
  const retryLink = `${frontendUrl}/checkout`;
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6;">We could not complete the payment for your order <strong>#${String(order._id).substring(0, 8).toUpperCase()}</strong>.</p>
    <div style="background: #fff5f5; border: 1px solid #fdd; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #b91c1c;">
      No amount was charged to you. Your order is not yet confirmed.
    </div>
    ${orderItemsTable(order.orderItems)}
    <div style="text-align: center; margin-top: 32px;">
      ${ctaButton('Try Payment Again', retryLink, true)}
    </div>
  `;
  return shell('Payment Not Completed', body);
}

// 4. Order status changed (shipped/delivered etc.)
function orderStatusUpdate({ order, frontendUrl, previousStatus }) {
  const orderLink = `${frontendUrl}/success?orderId=${order._id}`;
  const trackingHtml = order.trackingLink
    ? `<div style="background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #444; text-align: center;">
         Track your shipment: <br/><a href="${escapeHtml(order.trackingLink)}" style="color: #C2185B; font-weight: 600; display: inline-block; margin-top: 8px;">${escapeHtml(order.trackingLink)}</a>
       </div>`
    : '';
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6;">Your order <strong>#${String(order._id).substring(0, 8).toUpperCase()}</strong> status changed from <strong>${escapeHtml(previousStatus)}</strong> to <strong style="color: #C2185B;">${escapeHtml(order.status)}</strong>.</p>
    ${trackingHtml}
    ${orderItemsTable(order.orderItems)}
    <div style="margin: 32px 0 0; text-align: center;">
      ${ctaButton('Track Order', trackLink(order, frontendUrl), true)}
      ${ctaButton('View Details', orderLink, false)}
    </div>
  `;
  return shell(`Order Update: ${order.status}`, body);
}

// 5. Welcome email on registration
function welcome({ name, frontendUrl }) {
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
    <p style="color: #444; font-size: 15px; line-height: 1.6;">Welcome to Suki Ethnic! Your account is ready. Enjoy exclusive deals and a delightful shopping experience.</p>
    <div style="text-align: center; margin-top: 32px;">
      ${ctaButton('Start Shopping', frontendUrl, true)}
    </div>
  `;
  return shell('Welcome to Suki Ethnic!', body);
}

// 6. Newsletter subscription confirmation
function newsletterWelcome() {
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6;">You are now subscribed to the Suki Ethnic newsletter. We will keep you posted on new collections, offers and events.</p>
  `;
  return shell('Subscription Confirmed', body);
}

// 7. Abandoned-cart reminder (order created but payment never completed)
function abandonedCart({ order, frontendUrl, payUrl }) {
  const body = `
    <p style="color: #444; font-size: 15px; line-height: 1.6;">Hi ${escapeHtml(order.shippingAddress?.fullName || 'there')},</p>
    <p style="color: #444; font-size: 15px; line-height: 1.6;">You placed an order with us but the payment was not completed. Your items are still reserved for you:</p>
    ${orderItemsTable(order.orderItems)}
    <div style="background: #fff5f5; border: 1px solid #fdd; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #b91c1c;">
      No amount was charged yet. Complete your payment to confirm the order.
    </div>
    <div style="text-align: center; margin-top: 32px;">
      ${ctaButton('Complete Your Payment', payUrl, true)}
      ${ctaButton('Track Order', trackLink(order, frontendUrl), false)}
    </div>
  `;
  return shell(`Complete Your Order — #${String(order._id).substring(0, 8).toUpperCase()}`, body);
}

module.exports = { orderReceipt, paymentFailed, orderStatusUpdate, welcome, newsletterWelcome, abandonedCart };
