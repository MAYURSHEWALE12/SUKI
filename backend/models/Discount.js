const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed', 'free_shipping'],
      default: 'percentage',
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
