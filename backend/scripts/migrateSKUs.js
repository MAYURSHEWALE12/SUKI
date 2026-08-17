const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const generateSKU = () => {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SKU-${randomChars}`;
};

const migrateSKUs = async () => {
  try {
    await connectDB();

    const products = await Product.find({ $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }] });
    
    console.log(`Found ${products.length} products without an SKU.`);

    let updatedCount = 0;
    for (const product of products) {
      // Need to ensure unique SKU even in migration
      let unique = false;
      let newSku = '';
      while (!unique) {
        newSku = generateSKU();
        const existing = await Product.findOne({ sku: newSku });
        if (!existing) {
          unique = true;
        }
      }

      product.sku = newSku;
      await product.save();
      updatedCount++;
      console.log(`Updated ${product.name} with SKU: ${newSku}`);
    }

    console.log(`Successfully migrated ${updatedCount} products.`);
    process.exit();
  } catch (error) {
    console.error(`Error during migration: ${error.message}`);
    process.exit(1);
  }
};

migrateSKUs();
