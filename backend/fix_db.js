const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/suki').then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  for (const p of products) {
    const r = p.reviews || [];
    const numReviews = r.length;
    const rating = numReviews > 0 ? r.reduce((a, b) => a + b.rating, 0) / numReviews : 0;
    await db.collection('products').updateOne(
      { _id: p._id },
      { $set: { numReviews: numReviews, rating: rating } }
    );
  }
  console.log('Fixed DB!');
  process.exit(0);
});
