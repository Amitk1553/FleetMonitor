const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/fleet-monitor';

  // Log only the host part (never log credentials)
  const safeURI = mongoURI.replace(/:\/\/[^@]+@/, '://***:***@');
  console.log(`Connecting to MongoDB: ${safeURI}`);

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    if (err.message?.includes('Authentication failed')) {
      console.error('MongoDB ERROR: Authentication failed — check username/password in .env');
    } else if (err.message?.includes('whitelist') || err.message?.includes('IP')) {
      console.error('MongoDB ERROR: IP not whitelisted on Atlas — add your IP in Network Access');
    } else {
      console.error('MongoDB ERROR:', err.message);
    }
    throw err;
  }
};

module.exports = connectDB;
