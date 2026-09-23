const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const mongoURI =
    uri || process.env.MONGO_URI || 'mongodb://localhost:27017/fleet-monitor';
  await mongoose.connect(mongoURI);
  console.log(`MongoDB connected: ${mongoURI}`);
};

module.exports = connectDB;
