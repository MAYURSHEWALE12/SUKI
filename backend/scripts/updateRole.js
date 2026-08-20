const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/suki').then(async () => {
  const User = require('../models/User');
  await User.updateOne(
    { email: 'mvshewale2003@gmail.com' },
    { $set: { role: 'customer' } }
  );
  console.log('Role updated successfully.');
  process.exit();
}).catch(console.error);
