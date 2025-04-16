const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.SERVER_MONGODB_URI);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

module.exports = connectDB; 