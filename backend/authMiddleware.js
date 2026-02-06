const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * Attaches the decoded user to req.user if valid
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please login again' 
      });
    }
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Token verification failed' 
    });
  }
}

/**
 * Authorization middleware to check user roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No user found in request' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if token is missing
 * but validates and attaches user if token is present
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Token is invalid but we don't fail the request
    console.log('Invalid token in optional auth:', error.message);
  }

  next();
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};
