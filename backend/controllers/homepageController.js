const Homepage = require('../models/Homepage');

// @desc    Get homepage config
// @route   GET /api/homepage
// @access  Public
exports.getHomepageConfig = async (req, res) => {
  try {
    let config = await Homepage.findOne();
    if (!config) {
      // Create a default one if it doesn't exist
      config = await Homepage.create({
        heroBanners: [
          {
            image: 'https://images.unsplash.com/photo-1583391733959-f58318c47f58?q=80&w=1200&auto=format&fit=crop',
            heading: 'The Festive Collection',
            subheading: 'Embrace the season with our handpicked elegant styles.',
            buttonText: 'SHOP NOW',
            buttonLink: '/collections/lehengas'
          }
        ]
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update homepage config
// @route   PUT /api/homepage
// @access  Private/Admin
exports.updateHomepageConfig = async (req, res) => {
  try {
    const { heroBanners } = req.body;
    let config = await Homepage.findOne();

    if (config) {
      config.heroBanners = heroBanners || config.heroBanners;
      const updatedConfig = await config.save();
      res.json(updatedConfig);
    } else {
      res.status(404);
      throw new Error('Homepage config not found');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
