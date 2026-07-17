require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    // Make all users admin for demonstration purposes
    const result = await User.updateMany({}, { $set: { isAdmin: true } });
    console.log(`Updated ${result.modifiedCount} users to Admin status.`);
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

connectDB();
