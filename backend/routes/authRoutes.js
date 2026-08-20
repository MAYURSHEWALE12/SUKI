const express = require('express');
const router = express.Router();
const { registerUser, loginUser, adminLogin, getUserProfile, updateUserProfile, deleteUserAccount, toggleWishlist, getAllUsers, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/admin-login', authLimiter, adminLogin);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserAccount);
router.post('/wishlist', protect, toggleWishlist);
router.get('/users', protect, admin, getAllUsers);


router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', authLimiter, resetPassword);

module.exports = router;
