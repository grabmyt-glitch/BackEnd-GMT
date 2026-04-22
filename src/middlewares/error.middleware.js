const AppError = require("../utils/app-error");

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    details: err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
