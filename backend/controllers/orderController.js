const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const crypto = require('crypto');
const { validateDiscountCode, calculateDiscountAmount } = require('./discountController');
const { computeForwardHash, computeReverseHash } = require('../utils/payuHash');

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
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) {
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
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Order ID' });
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
      phone
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

    // Hash sequence : key|txnid|amount|productinfo|firstname|email|udf1..udf5|(7 empty)|salt
    const hash = computeForwardHash({ key, txnid, amount, productinfo, firstname, email, salt });

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
    const { txnid, mihpayid, status, hash, amount, productinfo, firstname, email, bank_ref_num, additionalCharges } = req.body;

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    // Reverse Hash sequence for verification:
    // salt|status|udf1..udf5|(7 empty)|email|firstname|productinfo|amount|txnid|key
    // (with additionalCharges prepended before salt when PayU sends it)
    const calculatedHash = computeReverseHash({ additionalCharges, salt, status, email, firstname, productinfo, amount, txnid, key });

    if (calculatedHash === hash) {
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
    
    // Dump for debugging
    const fs = require('fs');
    fs.writeFileSync('payu-debug.json', JSON.stringify({
      body: req.body,
      calculatedHash,
      receivedHash: hash
    }, null, 2));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/checkout?error=PaymentVerificationFailed`);
  } catch (error) {
    const fs = require('fs');
    fs.writeFileSync('payu-error.json', JSON.stringify({ error: error.message, stack: error.stack }));
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

