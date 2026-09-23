const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate resource' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
