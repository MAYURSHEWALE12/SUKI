// Usage: node scripts/resetAdminPassword.js --email admin@sukiethnic.com --password 'YourNewPass'
// Updates the admin user's password with the same bcrypt hashing used by the auth layer.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

(async () => {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const email = getArg('--email') || 'admin@sukiethnic.com';
  const password = getArg('--password');

  if (!password) {
    console.error('Usage: node scripts/resetAdminPassword.js --password "NewPassword" [--email admin@sukiethnic.com]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hash = await bcrypt.hash(password, 12);
  const res = await User.updateOne(
    { email, role: 'admin' },
    { $set: { password: hash } }
  );

  if (res.matchedCount === 0) {
    console.error(`No admin user found with email ${email}.`);
    process.exit(1);
  }

  console.log(`Password updated for ${email}.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});