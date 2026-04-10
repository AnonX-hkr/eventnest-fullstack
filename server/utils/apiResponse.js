/**
 * Standardised API response envelope.
 *
 * Success shape:  { success: true,  data: {...},   message?: "..." }
 * Error shape:    { success: false, error: "...",  details?: [...] }
 */

const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

const sendCreated = (res, data = null, message = "Created successfully") => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = "An error occurred", statusCode = 500, details = null) => {
  const body = { success: false, error: message };
  if (details) body.details = details;
  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    // Extra debugging info in dev only
    body._hint = "Check server logs for stack trace";
  }
  return res.status(statusCode).json(body);
};

const sendValidationError = (res, errors) => {
  return sendError(res, "Validation failed", 422, errors);
};

const sendUnauthorized = (res, message = "Authentication required") => {
  return sendError(res, message, 401);
};

const sendForbidden = (res, message = "You do not have permission to perform this action") => {
  return sendError(res, message, 403);
};

const sendNotFound = (res, resource = "Resource") => {
  return sendError(res, `${resource} not found`, 404);
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
};
