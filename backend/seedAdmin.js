require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminExists = await User.findOne({ email: 'admin@sukiethnic.com' });
    
    if (!adminExists) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@sukiethnic.com',
        password: 'password123',
        isAdmin: true
      });
      await admin.save();
      console.log('Admin user created successfully.');
    } else {
      adminExists.password = 'password123';
      adminExists.isAdmin = true;
      await adminExists.save();
      console.log('Admin user already exists. Password reset and privileges granted.');
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
