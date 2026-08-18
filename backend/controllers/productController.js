const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isValidObjectId, toFiniteNumber } = require('../utils/validation');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, minRating, sort, keyword, inStock, limit } = req.query;
    const filter = {};

    // Escape regex metacharacters so user input is matched literally (prevents
    // malformed queries and accidental wildcard matches).
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (keyword) {
      const pattern = escapeRegex(keyword.trim());
      if (pattern) {
        filter.$or = [
          { name: { $regex: pattern, $options: 'i' } },
          { description: { $regex: pattern, $options: 'i' } }
        ];
      }
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${escapeRegex(category.trim())}$`, 'i') };
    }

    if (inStock === 'true') {
      filter.countInStock = { $gt: 0 };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = toFiniteNumber(minPrice);
      const max = toFiniteNumber(maxPrice);
      if (minPrice !== undefined && min === null) {
        return res.status(400).json({ message: 'minPrice must be a number' });
      }
      if (maxPrice !== undefined && max === null) {
        return res.status(400).json({ message: 'maxPrice must be a number' });
      }
      if ((min !== null && min < 0) || (max !== null && max < 0)) {
        return res.status(400).json({ message: 'Prices cannot be negative' });
      }
      filter.price = {};
      if (min !== null) filter.price.$gte = min;
      if (max !== null) filter.price.$lte = max;
    }

    if (minRating !== undefined) {
      const rating = toFiniteNumber(minRating);
      if (rating === null || rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'minRating must be a number between 0 and 5' });
      }
      filter.rating = { $gte: rating };
    }

    let sortObj = {};
    if (sort === 'price_asc') {
      sortObj.price = 1;
    } else if (sort === 'price_desc') {
      sortObj.price = -1;
    } else if (sort === 'newest') {
      sortObj.createdAt = -1;
    } else if (sort === 'rating') {
      sortObj.rating = -1;
    }

    const parsedLimit = Number(limit);
    let query = Product.find(filter).sort(sortObj);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      query = query.limit(Math.min(parsedLimit, 100));
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Product ID' });
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, image, hoverImage, brand, category, countInStock, originalPrice, isNewArrival } = req.body;

    const numericPrice = toFiniteNumber(price);
    if (numericPrice === null || numericPrice < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }
    const numericStock = toFiniteNumber(countInStock);
    if (numericStock === null || numericStock < 0) {
      return res.status(400).json({ message: 'countInStock must be a non-negative number' });
    }

    const product = new Product({
      name: name || 'New Product',
      price: numericPrice,
      user: req.user ? req.user._id : null,
      image: image || 'https://via.placeholder.com/300x400',
      hoverImage: hoverImage || '',
      brand: brand || 'Suki Ethnic',
      category: category || 'Uncategorized',
      countInStock: numericStock,
      numReviews: 0,
      description: description || 'Product description goes here',
      originalPrice: originalPrice !== undefined && originalPrice !== null ? toFiniteNumber(originalPrice) : null,
      isNewArrival: isNewArrival === true || isNewArrival === 'true',
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, description, image, hoverImage, category, countInStock, originalPrice } = req.body;

    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Product ID' });
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;

      if (price !== undefined) {
        const numericPrice = toFiniteNumber(price);
        if (numericPrice === null || numericPrice < 0) {
          return res.status(400).json({ message: 'Price must be a non-negative number' });
        }
        product.price = numericPrice;
      }

      product.description = description || product.description;
      product.image = image || product.image;
      product.hoverImage = hoverImage || product.hoverImage;
      product.category = category || product.category;

      if (countInStock !== undefined) {
        const numericStock = toFiniteNumber(countInStock);
        if (numericStock === null || numericStock < 0) {
          return res.status(400).json({ message: 'countInStock must be a non-negative number' });
        }
        product.countInStock = numericStock;
      }

      if (originalPrice !== undefined && originalPrice !== null) {
        const numericOriginal = toFiniteNumber(originalPrice);
        if (numericOriginal === null || numericOriginal < 0) {
          return res.status(400).json({ message: 'originalPrice must be a non-negative number' });
        }
        product.originalPrice = numericOriginal;
      } else if (originalPrice === null) {
        product.originalPrice = null;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid Product ID' });
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID' });
    }

    const { rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      const orderExists = await Order.findOne({
        user: req.user._id,
        'orderItems.product': product._id
      });

      if (!orderExists) {
        return res.status(400).json({ message: 'You can only review products you have purchased.' });
      }

      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      return res.status(404).json({ message: '' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const products = await Product.find({}).select('name reviews');
    let allReviews = [];
    products.forEach(product => {
      product.reviews.forEach(review => {
        allReviews.push({
          _id: review._id,
          productName: product.name,
          productId: product._id,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        });
      });
    });
    res.json(allReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

