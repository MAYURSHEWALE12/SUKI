const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const sendEmail = require('../utils/sendEmail');
const { newsletterWelcome } = require('../utils/emailTemplates');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/subscribers
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if already subscribed
    let subscriber = await Subscriber.findOne({ email });

    if (subscriber) {
      return res.status(400).json({ message: 'You are already subscribed to our newsletter' });
    }

    // Create new subscriber
    subscriber = await Subscriber.create({ email });

    // Confirmation email - advisory; never block subscription on SMTP
    sendEmail({
      email: subscriber.email,
      subject: 'Welcome to the Suki Ethnic Newsletter!',
      html: newsletterWelcome(),
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to the newsletter!',
      data: subscriber,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Server error while subscribing' });
  }
});

// @route   GET /api/subscribers
// @desc    Get all subscribers
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Fetch subscribers error:', error);
    res.status(500).json({ message: 'Server error while fetching subscribers' });
  }
});

module.exports = router;
