module.exports = function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal server error' });
};
