const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.SERVER_MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, options);
    console.log('MongoDB connected successfully!');
    
    // Test the connection with a simple query
    const admin = await mongoose.connection.db.admin();
    const dbInfo = await admin.listDatabases();
    console.log('Available databases:', dbInfo.databases.map(db => db.name));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.name === 'MongoServerError') {
      console.error('MongoDB server error details:', err);
    }
    if (err.name === 'MongoNetworkError') {
      console.error('Network error - check your connection and firewall settings');
    }
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB; 