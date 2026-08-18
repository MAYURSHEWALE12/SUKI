const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    images: [{ type: String }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      required: true,
    },
    images: [{
      type: String
    }],
    video: {
      type: String,
      required: false,
    },
    hoverImage: {
      type: String,
      required: false,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    celebrity: {
      type: String,
      required: false,
    },
    occasion: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    highlights: {
      type: String,
      required: false,
    },
    careInstructions: {
      type: String,
      required: false,
    },
    whatsIncluded: {
      type: String,
      required: false,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    originalPrice: {
      type: Number,
      required: false,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },


    isNewArrival: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
