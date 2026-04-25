const jwt = require("jsonwebtoken");
const config = require("../config/env");
const AppError = require("../utils/app-error");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError("Access token is required.", 401));
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token has expired.", 401));
      }
      return next(new AppError("Invalid or malformed token.", 401));
    }

    // Attach user info to request object
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
};
