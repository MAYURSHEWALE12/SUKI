const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const { isValidEmail, isValidPhone, isValidObjectId } = require('../utils/validation');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Please provide a name' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Please provide a valid phone number' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email, but explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email, but explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied: You do not have administrator privileges.' });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist || [],
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name !== undefined && (!req.body.name || typeof req.body.name !== 'string' || !req.body.name.trim())) {
        return res.status(400).json({ message: 'Please provide a valid name' });
      }
      user.name = req.body.name || user.name;

      if (req.body.email && req.body.email !== user.email) {
        if (!isValidEmail(req.body.email)) {
          return res.status(400).json({ message: 'Please provide a valid email' });
        }
        const emailTaken = await User.findOne({ email: req.body.email });
        if (emailTaken) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
        user.email = req.body.email;
      }
      if (req.body.phone !== undefined && req.body.phone !== '' && !isValidPhone(req.body.phone)) {
        return res.status(400).json({ message: 'Please provide a valid phone number' });
      }
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

      if (req.body.addresses) {
        if (!Array.isArray(req.body.addresses)) {
          return res.status(400).json({ message: 'Addresses must be an array' });
        }
        user.addresses = req.body.addresses;
      }

      if (req.body.password) {
        if (req.body.password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        wishlist: updatedUser.wishlist || [],
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/profile
// @access  Private
exports.deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle item in wishlist
// @route   POST /api/auth/wishlist
// @access  Private
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid Product ID' });
    }
    const user = await User.findById(req.user._id);

    if (user) {
      const index = user.wishlist.indexOf(productId);
      if (index !== -1) {
        user.wishlist.splice(index, 1);
      } else {
        user.wishlist.push(productId);
      }
      await user.save();
      res.json(user.wishlist);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;
    const keyword = (req.query.keyword || '').toString().trim();

    const userMatch = keyword
      ? {
          $or: [
            { name: { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
            { email: { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          ],
        }
      : {};

    const userQuery = User.find(userMatch);
    if (hasPagination) userQuery.skip((page - 1) * limit).limit(Math.min(limit, 100));

    const [users, orderStats, total] = await Promise.all([
      userQuery.exec(),
      Order.aggregate([
        { $group: { _id: '$user', totalOrders: { $sum: 1 }, totalSpend: { $sum: '$totalPrice' } } }
      ]),
      hasPagination ? User.countDocuments(userMatch) : Promise.resolve(0),
    ]);

    const statsByUser = new Map(orderStats.map((s) => [String(s._id), s]));

    const usersWithStats = users.map((user) => {
      const stats = statsByUser.get(user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.role === 'admin',
        role: user.role,
        totalSpend: stats ? stats.totalSpend : 0,
        totalOrders: stats ? stats.totalOrders : 0,
        createdAt: user.createdAt
      };
    });

    if (hasPagination) {
      return res.json({
        data: usersWithStats,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        total,
      });
    }

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
