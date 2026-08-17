const express = require('express');
const router = express.Router();
const { getDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount } = require('../controllers/discountController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to validate discount code at checkout
router.post('/validate', validateDiscount);

// Admin-only routes for managing discounts
router.route('/')
  .get(protect, admin, getDiscounts)
  .post(protect, admin, createDiscount);

router.route('/:id')
  .put(protect, admin, updateDiscount)
  .delete(protect, admin, deleteDiscount);

module.exports = router;
