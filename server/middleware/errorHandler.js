const { sendError } = require("../utils/apiResponse");

/**
 * Global Express error handler — must be registered LAST with app.use()
 *
 * Catches:
 *   - Mongoose ValidationError     → 422
 *   - Mongoose CastError           → 400
 *   - Mongoose duplicate key 11000 → 409
 *   - JWT errors                   → 401
 *   - Everything else              → 500
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Log in development
  if (process.env.NODE_ENV !== "production") {
    console.error(`\n❌ [${req.method}] ${req.originalUrl}`);
    console.error(err);
  }

  // ── Mongoose Validation ──────────────────────────────────────────────────────
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, "Validation failed", 422, messages);
  }

  // ── Mongoose Bad ObjectId ────────────────────────────────────────────────────
  if (err.name === "CastError") {
    return sendError(res, `Invalid value for field '${err.path}': "${err.value}"`, 400);
  }

  // ── MongoDB Duplicate Key ────────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue?.[field];
    return sendError(
      res,
      `Duplicate value: '${value}' is already taken for '${field}'.`,
      409
    );
  }

  // ── JWT ──────────────────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") return sendError(res, "Invalid token", 401);
  if (err.name === "TokenExpiredError") return sendError(res, "Token expired", 401);

  // ── Known operational errors (thrown with .statusCode) ───────────────────────
  if (err.statusCode && err.statusCode < 500) {
    return sendError(res, err.message, err.statusCode);
  }

  // ── Default 500 ───────────────────────────────────────────────────────────────
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again later."
      : err.message;

  return sendError(res, message, 500);
};

/**
 * 404 catch-all — register BEFORE errorHandler
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFound };
