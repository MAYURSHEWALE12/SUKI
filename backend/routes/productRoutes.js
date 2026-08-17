const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getAllReviews } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimit');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.get('/reviews/all', getAllReviews);

router.route('/:id/reviews')
  .post(protect, reviewLimiter, createProductReview);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
