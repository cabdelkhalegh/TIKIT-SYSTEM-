// Global error handler middleware for the TIKIT system

const { ApplicationError } = require('../utils/error-types');

function globalErrorHandler(err, req, res, next) {
  // Generate unique request ID for tracking
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error details
  console.error('\n========== ERROR ==========');
  console.error('Request ID:', requestId);
  console.error('Timestamp:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('Path:', req.path);
  console.error('Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }
  console.error('===========================\n');

  // Handle known application errors
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      success: false,
      requestId,
      ...err.toJSON()
    });
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, req, res, requestId);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      requestId,
      error: 'AuthenticationError',
      message: 'Invalid authentication token',
      statusCode: 401
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      requestId,
      error: 'AuthenticationError',
      message: 'Authentication token has expired',
      statusCode: 401
    });
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      requestId,
      error: 'ValidationError',
      message: 'Validation failed',
      fieldErrors: errors.map(e => ({
        field: e.param,
        message: e.msg,
        value: e.value
      })),
      statusCode: 400
    });
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      requestId,
      error: 'ValidationError',
      message: 'Invalid JSON format in request body',
      statusCode: 400
    });
  }

  // Default error response for unexpected errors
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(statusCode).json({
    success: false,
    requestId,
    error: err.name || 'InternalServerError',
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function handlePrismaError(err, req, res, requestId) {
  let statusCode = 500;
  let message = 'Database operation failed';

  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      statusCode = 409;
      const targetField = err.meta?.target ? err.meta.target.join(', ') : 'field';
      message = `A record with this ${targetField} already exists`;
      break;
    
    case 'P2003':
      // Foreign key constraint violation
      statusCode = 400;
      message = 'Referenced record does not exist';
      break;
    
    case 'P2025':
      // Record not found
      statusCode = 404;
      message = 'Record not found';
      break;
    
    case 'P2014':
      // Invalid ID
      statusCode = 400;
      message = 'Invalid identifier provided';
      break;
    
    case 'P2016':
      // Query interpretation error
      statusCode = 400;
      message = 'Invalid query parameters';
      break;
    
    default:
      if (process.env.NODE_ENV === 'development') {
        message = `Database error: ${err.message}`;
      }
  }

  return res.status(statusCode).json({
    success: false,
    requestId,
    error: 'DatabaseError',
    message,
    code: err.code,
    statusCode
  });
}

module.exports = globalErrorHandler;
