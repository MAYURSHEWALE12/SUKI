const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/suki')
  .then(async () => {
    const products = await mongoose.connection.db.collection('products').find({ video: { $exists: true, $ne: '' } }).toArray();
    console.log(JSON.stringify(products.map(p => ({name: p.name, video: p.video})), null, 2));
    process.exit(0);
  });
