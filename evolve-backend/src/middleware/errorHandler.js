import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// 404 for any route that doesn't match — placed after all routes.
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: { message: 'Not found.', code: 'NOT_FOUND' } });
};

// Final error-handling middleware (must have 4 args for Express to
// recognize it as an error handler).
//
// Rule: operational errors (AppError) return their specific safe message.
// Anything else (a bug, a DB driver error, an unexpected exception) is
// logged in full detail server-side and returns a fully generic message —
// never a stack trace, SQL error, file path, or internal config to the client.
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isOperational = err.isOperational === true;

  logger.error(
    {
      event: 'request_error',
      statusCode: err.statusCode || 500,
      code: err.code,
      message: err.message,
      stack: env.isProd ? undefined : err.stack,
      path: req.path,
      method: req.method,
      userId: req.userId,
    },
    'Request failed'
  );

  if (isOperational) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  return res.status(500).json({
    error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
  });
};
