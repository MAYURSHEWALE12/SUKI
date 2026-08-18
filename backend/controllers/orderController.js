const mongoose = require('mongoose');
const fs = require('fs');
const Order = require('../models/Order');
const Product = require('../models/Product');
const crypto = require('crypto');
const { validateDiscountCode, calculateDiscountAmount } = require('./discountController');
const { computeForwardHash, computeReverseHash } = require('../utils/payuHash');
const { isValidObjectId } = require('../utils/validation');

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
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const validPaymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'Cash On Delivery'];
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
      const isAdmin = req.user && req.user.isAdmin;
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

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
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

    if (keyword) {
      const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pipeline = [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        { $addFields: { _idStr: { $toString: '$_id' } } },
        {
          $match: {
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

    const query = Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });

    if (hasPagination) {
      const total = await Order.countDocuments();
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
      order.status = req.body.status || order.status;
      if (req.body.trackingLink !== undefined) order.trackingLink = req.body.trackingLink;
      if (req.body.adminNotes !== undefined) order.adminNotes = req.body.adminNotes;
      
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
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
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/success?orderId=${txnid}`);
        }
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: mihpayid,
          status: status,
          update_time: new Date().toISOString(),
          email_address: email,
        };
        await order.save();

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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/checkout?error=PaymentFailed`);
};

