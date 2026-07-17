const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema(
  {
    heroBanners: [
      {
        image: { type: String, required: true },
        heading: { type: String, required: true },
        subheading: { type: String, required: true },
        buttonText: { type: String, required: true },
        buttonLink: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Homepage = mongoose.model('Homepage', homepageSchema);

module.exports = Homepage;
