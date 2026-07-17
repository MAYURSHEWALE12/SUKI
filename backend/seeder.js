const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const products = require('./data/products');

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await Product.deleteMany();

    const adminUser = await User.findOne({ email: 'admin@sukiethnic.com' }); // We don't have admin yet, so just assign first user or null

    const createdProducts = products.map((product) => {
      return { ...product, user: adminUser ? adminUser._id : null };
    });

    await Product.insertMany(createdProducts);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
