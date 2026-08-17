const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { createApp } = require('./app');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = createApp();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});