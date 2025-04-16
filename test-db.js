require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    const encodedPassword = encodeURIComponent(process.env.MONGODB_PASSWORD);
    const uri = `mongodb://${process.env.MONGODB_USER}:${encodedPassword}@localhost:27017/language-app`;
    await mongoose.connect(uri);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test if we can create and read from the database
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Test.create({ name: 'test' });
    const result = await Test.findOne({ name: 'test' });
    console.log('✅ Successfully created and read test document:', result);
    
    // Clean up
    await Test.deleteMany({});
    console.log('✅ Cleaned up test documents');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection(); 