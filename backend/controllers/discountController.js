const Discount = require('../models/Discount');

// Shared helper: finds a code and checks active/expiry. Returns { discount } or { error }.
const validateDiscountCode = async (code) => {
  if (!code) return { discount: null, error: 'Please provide a discount code' };
  const discount = await Discount.findOne({ code: code.toUpperCase() });
  if (!discount) return { discount: null, error: 'Invalid discount code' };
  if (!discount.isActive) return { discount: null, error: 'This discount code is no longer active' };
  if (new Date() > new Date(discount.expiryDate)) return { discount: null, error: 'This discount code has expired' };
  return { discount, error: null };
};

// Shared helper: computes the discount amount for a cart total.
const calculateDiscountAmount = (discount, cartTotal) => {
  if (discount.type === 'percentage') {
    return Math.round((cartTotal * discount.value) / 100 * 100) / 100;
  }
  if (discount.type === 'fixed') {
    return Math.min(discount.value, cartTotal);
  }
  return 0; // free_shipping has no monetary value in the current checkout
};

// Shared helpers, exported for use by order creation so totals stay server-authoritative
exports.validateDiscountCode = validateDiscountCode;
exports.calculateDiscountAmount = calculateDiscountAmount;

// @desc    Get all discounts
// @route   GET /api/discounts
// @access  Private/Admin
exports.getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a discount
// @route   POST /api/discounts
// @access  Private/Admin
exports.createDiscount = async (req, res) => {
  try {
    const { code, type, value, minOrderValue, isActive, expiryDate } = req.body;
    
    const discountExists = await Discount.findOne({ code: code.toUpperCase() });
    if (discountExists) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    const discount = await Discount.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrderValue,
      isActive,
      expiryDate,
    });

    res.status(201).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a discount
// @route   PUT /api/discounts/:id
// @access  Private/Admin
exports.updateDiscount = async (req, res) => {
  try {
    const { code, type, value, minOrderValue, isActive, expiryDate } = req.body;

    const discount = await Discount.findById(req.params.id);

    if (discount) {
      discount.code = code ? code.toUpperCase() : discount.code;
      discount.type = type || discount.type;
      discount.value = value !== undefined ? value : discount.value;
      discount.minOrderValue = minOrderValue !== undefined ? minOrderValue : discount.minOrderValue;
      discount.isActive = isActive !== undefined ? isActive : discount.isActive;
      discount.expiryDate = expiryDate || discount.expiryDate;

      const updatedDiscount = await discount.save();
      res.json(updatedDiscount);
    } else {
      res.status(404).json({ message: 'Discount not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a discount
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (discount) {
      res.json({ message: 'Discount removed' });
    } else {
      res.status(404).json({ message: 'Discount not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate and calculate discount
// @route   POST /api/discounts/validate
// @access  Public
exports.validateDiscount = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    const { discount, error } = await validateDiscountCode(code);
    if (error) {
      return res.status(error === 'Invalid discount code' ? 404 : 400).json({ message: error });
    }

    if (cartTotal < discount.minOrderValue) {
      return res.status(400).json({ 
        message: `Minimum order value of ₹${discount.minOrderValue} required to use this code` 
      });
    }

    const discountAmount = calculateDiscountAmount(discount, cartTotal);

    res.json({
      code: discount.code,
      type: discount.type,
      discountAmount,
      newTotal: cartTotal - discountAmount,
      message: 'Discount applied successfully!'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
