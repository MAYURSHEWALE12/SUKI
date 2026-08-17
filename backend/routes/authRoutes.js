const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUserAccount, toggleWishlist, getAllUsers } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserAccount);
router.post('/wishlist', protect, toggleWishlist);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;
