const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // Make sure to read .env from parent dir

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/suki').then(async () => {
  const User = require('../models/User');
  
  const users = await User.collection.find({}).toArray();
  for (const user of users) {
    let newRole = 'customer';
    if (user.isAdmin === true) {
      newRole = 'admin';
    } else if (user.role) {
      newRole = user.role;
    }
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { role: newRole }, $unset: { isAdmin: '' } }
    );
  }
  console.log('Migration complete. Migrated ' + users.length + ' users.');
  process.exit();
}).catch(console.error);
