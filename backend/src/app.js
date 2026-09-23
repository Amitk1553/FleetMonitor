const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const deviceRoutes = require('./routes/devices');
const summaryRoutes = require('./routes/summary');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/devices', deviceRoutes);
app.use('/summary', summaryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

module.exports = app;
