const mongoose = require('mongoose');
const fs = require('fs');
const Order = require('../models/Order');
const Product = require('../models/Product');
const crypto = require('crypto');
const { validateDiscountCode, calculateDiscountAmount } = require('./discountController');
const { computeForwardHash, computeReverseHash } = require('../utils/payuHash');
const { isValidObjectId } = require('../utils/validation');
const sendEmail = require('../utils/sendEmail');
const { orderReceipt, paymentFailed, orderStatusUpdate } = require('../utils/emailTemplates');

const VALID_ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

// PayU callback debug dumps must never write raw customer data (email, name,
// address) to disk. Only technical fields survive; email is masked. Enabled
// explicitly with PAYU_DEBUG=true.
function sanitizePayuDebug(body) {
  const email = String(body.email || '');
  const [user, domain] = email.split('@');
  const maskedEmail = email && user
    ? `${user[0]}***@${domain}`
    : '';
  return {
    txnid: body.txnid,
    mihpayid: body.mihpayid,
    status: body.status,
    amount: body.amount,
    bank_ref_num: body.bank_ref_num,
    additionalCharges: body.additionalCharges,
    email: maskedEmail,
  };
}

function payuDebugEnabled() {
  return process.env.PAYU_DEBUG === 'true';
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (should be Private in production, but keeping Public for now since auth is optional)
exports.addOrderItems = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      discountCode,
      email,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const validPaymentMethods = ['Credit Card', 'Debit Card', 'UPI'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Load products from the database so prices/names/images are server-authoritative
    const products = await Product.find({ _id: { $in: orderItems.map((i) => i.product) } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const validatedItems = [];
    for (const item of orderItems) {
      const product = productMap.get(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }
      if (product.countInStock <= 0) {
        return res.status(400).json({ message: `${product.name} is currently unavailable` });
      }
      validatedItems.push({
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        product: product._id,
      });
    }

    // Server-side totals - never trust client-submitted prices
    const itemsPrice = Math.round(validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const shippingPrice = 0; // shipping is currently free

    // Re-validate and apply the discount server-side
    let discountAmount = 0;
    if (discountCode) {
      const { discount, error } = await validateDiscountCode(discountCode);
      if (error) {
        return res.status(400).json({ message: error });
      }
      if (itemsPrice < discount.minOrderValue) {
        return res.status(400).json({
          message: `Minimum order value of ₹${discount.minOrderValue} required to use this code`
        });
      }
      discountAmount = calculateDiscountAmount(discount, itemsPrice);
    }

    const totalPrice = Math.max(0, Math.round((itemsPrice - discountAmount + shippingPrice) * 100) / 100);

    const sessionToken = crypto.randomBytes(16).toString('hex');
    const order = new Order({
      orderItems: validatedItems,
      user: req.user ? req.user._id : null, // Optional user
      shippingAddress,
      paymentMethod,
      itemsPrice,
      discountCode: discountCode ? String(discountCode).toUpperCase() : '',
      discountAmount,
      shippingPrice,
      totalPrice,
      sessionToken,
      email: email || (req.user ? req.user.email : undefined),
    });

    const createdOrder = await order.save();

    
    // Stock is unlimited; availability is a boolean flag managed by admin.
    // No inventory decrement on order creation.

    
    

    res.status(201).json(createdOrder);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
    const order = await Order.findById(req.params.id);

    if (order) {
      const sessionToken = req.headers['x-session-token'];
      const isOwner = req.user && order.user && order.user.equals(req.user._id);
      const isAdmin = req.user && req.user.role === 'admin';
      const isSessionValid = sessionToken && order.sessionToken === sessionToken;

      if (isOwner || isAdmin || isSessionValid) {
        res.json(order);
      } else {
        res.status(401).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order tracking status (timeline-safe fields only)
// @route   GET /api/orders/track/:id?token=...
// @access  Public (owner via JWT, guest via order session token)
exports.getOrderTracking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const queryToken = req.query.token;
    const headerToken = req.headers['x-session-token'];
    const isOwner = req.user && order.user && order.user.equals(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    const isSessionValid = (queryToken || headerToken) && order.sessionToken === (queryToken || headerToken);

    if (!(isOwner || isAdmin || isSessionValid)) {
      return res.status(401).json({ message: 'Not authorized to track this order' });
    }

    res.json({
      _id: order._id,
      status: order.status,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingLink: order.trackingLink,
      totalPrice: order.totalPrice,
      orderItems: order.orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: { $nin: ['Pending Payment', 'Payment Failed'] } }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;
    const keyword = (req.query.keyword || '').toString().trim();

    // Unpaid/unconfirmed orders are hidden by default; admins can opt in via
    // ?includePending=true to follow up on abandoned checkouts and failures.
    const includePending = req.query.includePending === 'true';
    const statusMatch = includePending
      ? {}
      : { status: { $nin: ['Pending Payment', 'Payment Failed'] } };

    if (keyword) {
      const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pipeline = [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        { $addFields: { _idStr: { $toString: '$_id' } } },
        {
          $match: {
            ...statusMatch,
            $or: [
              { _idStr: { $regex: pattern, $options: 'i' } },
              { 'userInfo.name': { $regex: pattern, $options: 'i' } },
              { 'shippingAddress.fullName': { $regex: pattern, $options: 'i' } },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $addFields: { 'user.id': '$userInfo._id', 'user.name': '$userInfo.name', 'user.email': '$userInfo.email' } },
        { $project: { userInfo: 0, _idStr: 0 } },
      ];

      if (hasPagination) {
        const [result] = await Order.aggregate([
          ...pipeline,
          { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: Math.min(limit, 100) }], total: [{ $count: 'n' }] } },
        ]);
        const total = result.total[0] ? result.total[0].n : 0;
        return res.json({ data: result.data, page, pages: Math.max(1, Math.ceil(total / limit)), total });
      }

      return res.json(await Order.aggregate(pipeline));
    }

    const query = Order.find(statusMatch).populate('user', 'id name email').sort({ createdAt: -1 });

    if (hasPagination) {
      const total = await Order.countDocuments(statusMatch);
      const orders = await query.skip((page - 1) * limit).limit(Math.min(limit, 100));
      return res.json({
        data: orders,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        total,
      });
    }

    res.json(await query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
    if (req.body.status !== undefined && !VALID_ORDER_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findById(req.params.id);

    if (order) {
      const previousStatus = order.status;
      const newStatus = req.body.status || order.status;

      // Enforce one-way progression: Processing → Shipped → Delivered
      const STATUS_RANK = { 'Processing': 1, 'Shipped': 2, 'Delivered': 3 };
      const currentRank = STATUS_RANK[previousStatus];
      const targetRank = STATUS_RANK[newStatus];

      if (currentRank !== undefined && targetRank !== undefined && targetRank < currentRank) {
        return res.status(400).json({
          message: `Cannot move order back from "${previousStatus}" to "${newStatus}". Status can only move forward: Processing → Shipped → Delivered.`
        });
      }

      order.status = newStatus;
      if (req.body.trackingLink !== undefined) order.trackingLink = req.body.trackingLink;
      if (req.body.adminNotes !== undefined) order.adminNotes = req.body.adminNotes;
      
      const updatedOrder = await order.save();

      // Notify the customer when the status actually changes
      if (order.email && order.status !== previousStatus) {
        sendEmail({
          email: order.email,
          subject: `Order Update: ${order.status} - #${order._id.toString().substring(0, 8).toUpperCase()}`,
          html: orderStatusUpdate({ order, previousStatus, frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000' }),
        });
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resume payment for an abandoned order (email link target)
// @route   GET /api/orders/:id/pay?token=...
// @access  Public (owner via session token, JWT owner, or admin)
exports.resumeOrderPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const queryToken = req.query.token;
    const headerToken = req.headers['x-session-token'];
    const isOwner = req.user && order.user && order.user.equals(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    const isSessionValid = (queryToken || headerToken) && order.sessionToken === (queryToken || headerToken);

    if (!(isOwner || isAdmin || isSessionValid)) {
      return res.status(401).json({ message: 'Not authorized to pay this order' });
    }

    if (order.isPaid) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/success?orderId=${order._id}`);
    }

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const gatewayUrl = process.env.PAYU_ENV === 'production'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';

    const txnid = order._id.toString();
    const amount = order.totalPrice;
    const productinfo = 'Suki Ethnic Purchase';
    const firstname = (order.shippingAddress?.fullName || 'Customer').split(' ')[0];
    const email = order.email || '';

    const hash = computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt });
    const surl = `${req.protocol}://${req.get('host')}/api/orders/payu-success`;
    const furl = `${req.protocol}://${req.get('host')}/api/orders/payu-failure`;

    const hiddenFields = [
      ['key', key], ['txnid', txnid], ['hash', hash], ['amount', amount],
      ['productinfo', productinfo], ['firstname', firstname], ['email', email],
      ['phone', order.shippingAddress?.phone || ''], ['surl', surl], ['furl', furl],
    ].map(([name, value]) => `<input type="hidden" name="${name}" value="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" />`).join('\n');

    res.setHeader('Content-Type', 'text/html');
    // Helmet's default CSP forbids inline scripts AND form submissions to
    // other origins (form-action 'self'), which would silently break this
    // auto-submit page. Scope a permissive policy to this response only:
    // it contains no user input, just a form that posts to the PayU gateway.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action *; base-uri 'none'; frame-ancestors 'none'"
    );
    res.send(`<!DOCTYPE html>
<html>
<head><title>Redirecting to payment…</title></head>
<body style="font-family: Arial, sans-serif; background:#fafafa; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0;">
  <noscript><p>Please enable JavaScript to be redirected to secure payment.</p></noscript>
  <form id="payuForm" method="POST" action="${gatewayUrl}">
    ${hiddenFields}
  </form>
  <script>document.getElementById('payuForm').submit();</script>
</body>
</html>`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate PayU Hash
// @route   POST /api/orders/:id/payu-hash
// @access  Public (should be Private in production)
exports.generatePayuHash = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const {
      productinfo,
      firstname,
      phone,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
    } = req.body;

    // Prefer the logged-in user's verified email over the client-supplied one
    const email = (req.user && req.user.email) || req.body.email;

    // The payment amount must match the server-computed order total,
    // otherwise a client could pay a fraction of the real order value.
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(order.totalPrice * 100)) {
      return res.status(400).json({ message: 'Amount does not match order total' });
    }

    const txnid = order._id.toString(); // Use Order ID as txnid
    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const gatewayUrl = process.env.PAYU_ENV === 'production'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';

    // Hash sequence : key|txnid|amount|productinfo|firstname|email|udf1..udf5|(6 empty)|salt
    const hash = computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt, udf1, udf2, udf3, udf4, udf5 });

    res.json({
      key,
      txnid,
      hash,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      gatewayUrl,
      surl: `${req.protocol}://${req.get('host')}/api/orders/payu-success`,
      furl: `${req.protocol}://${req.get('host')}/api/orders/payu-failure`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle PayU Success
// @route   POST /api/orders/payu-success
// @access  Public (Webhook)
exports.handlePayuSuccess = async (req, res) => {
  try {
    const { txnid, mihpayid, status, hash, amount, productinfo, firstname, email, bank_ref_num, additionalCharges, udf1, udf2, udf3, udf4, udf5 } = req.body;

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    // Reverse Hash sequence for verification:
    // salt|status|(6 empty)|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    // (with additionalCharges prepended before salt when PayU sends it)
    const calculatedHash = computeReverseHash({ additionalCharges, salt, status, email, firstname, productinfo, amount, txnid, key, udf1, udf2, udf3, udf4, udf5 });

    if (calculatedHash === hash && status === 'success') {
      const order = await Order.findById(txnid);
      if (order) {
        // Guard against duplicate PayU notifications double-decrementing stock
        if (order.isPaid) {
          
        // Send Order Confirmation Email
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #D81B60;">Order Confirmed!</h2>
              <p>Hi ${order.shippingAddress?.fullName || 'there'},</p>
              <p>Thank you for your purchase. We've received your order <strong>#${order._id.toString().substring(0, 8).toUpperCase()}</strong> and are getting it ready to be shipped.</p>
              <h3>Order Summary</h3>
              <ul style="list-style: none; padding: 0;">
                ${order.orderItems.map(item => `<li style="margin-bottom: 10px;">${item.quantity}x ${item.name} - ₹${item.price * item.quantity}</li>`).join('')}
              </ul>
              <p><strong>Total Amount: ₹${order.totalPrice}</strong></p>
              <br/>
              <p>We'll notify you once your order ships.</p>
              <p>Best,<br/>Suki Ethnic</p>
            </div>
          `;

          if (order.paymentResult && order.paymentResult.email_address) {
            await sendEmail({
              email: order.paymentResult.email_address,
              subject: `Order Confirmation - Suki Ethnic #${order._id.toString().substring(0, 8).toUpperCase()}`,
              html: emailHtml
            });
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/success?orderId=${txnid}`);

        }
        order.status = 'Processing';
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: mihpayid,
          status: status,
          update_time: new Date().toISOString(),
          email_address: email,
        };
        await order.save();

        // Payment confirmed - email is advisory; never block the redirect on SMTP
        if (order.email) {
          sendEmail({
            email: order.email,
            subject: `Payment Received - Order #${txnid.substring(0, 8).toUpperCase()}`,
            html: orderReceipt({ order, frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000' }),
          });
        }

        // Stock is unlimited; availability is a boolean flag managed by admin.

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/success?orderId=${txnid}`);
      }
    }
    
    if (payuDebugEnabled()) {
      fs.writeFileSync('payu-debug.json', JSON.stringify({
        body: sanitizePayuDebug(req.body),
        calculatedHash,
        receivedHash: hash
      }, null, 2));
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/checkout?error=PaymentVerificationFailed`);
  } catch (error) {
    if (payuDebugEnabled()) {
      fs.writeFileSync('payu-error.json', JSON.stringify({ error: error.message, stack: error.stack }));
    }
    console.error('PayU Success Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/checkout?error=PaymentFailed`);
  }
};

// @desc    Handle PayU Failure
// @route   POST /api/orders/payu-failure
// @access  Public (Webhook)
exports.handlePayuFailure = async (req, res) => {
  try {
    const { txnid, status, hash, amount, productinfo, firstname, email, additionalCharges, udf1, udf2, udf3, udf4, udf5 } = req.body;

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    // Verify the callback with the same reverse-hash layout as the success
    // handler, so a random POST cannot flip an order's status.
    const calculatedHash = computeReverseHash({ additionalCharges, salt, status, email, firstname, productinfo, amount, txnid, key, udf1, udf2, udf3, udf4, udf5 });

    if (calculatedHash === hash && status === 'failure' && txnid) {
      const order = await Order.findById(txnid);
      if (order && !order.isPaid) {
        order.status = 'Payment Failed';
        await order.save();

        if (order.email) {
          sendEmail({
            email: order.email,
            subject: `Payment Not Completed - Order #${txnid.substring(0, 8).toUpperCase()}`,
            html: paymentFailed({ order, frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000' }),
          });
        }
      }
    }
  } catch (error) {
    console.error('PayU Failure Error:', error);
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/checkout?error=PaymentFailed`);
};

