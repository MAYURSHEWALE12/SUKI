const express = require('express');
const router = express.Router();
const { addOrderItems, getOrderById, getMyOrders, getAllOrders, updateOrderStatus, generatePayuHash, handlePayuSuccess, handlePayuFailure } = require('../controllers/orderController');
const { protect, optionalAuth, admin } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimit');

router.post('/', orderLimiter, optionalAuth, addOrderItems);
router.post('/:id/payu-hash', optionalAuth, generatePayuHash);
router.post('/payu-success', handlePayuSuccess);
router.post('/payu-failure', handlePayuFailure);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', getOrderById);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
