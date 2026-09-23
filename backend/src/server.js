require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { DEFAULT_PORT } = require('./utils/constants');

const PORT = process.env.PORT || DEFAULT_PORT;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Fleet Monitor API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
