const express = require('express');
const router = express.Router();
const { addOrderItems, getOrderById, getMyOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, optionalAuth, admin } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', getOrderById);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
