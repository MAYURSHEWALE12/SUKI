const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

module.exports = Subscriber;
