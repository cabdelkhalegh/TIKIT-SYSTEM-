// TIKIT Access Control Layer
const securityManager = require('../utils/security-manager');

class AccessController {
  // Verify request has valid session token
  requireAuthentication(req, res, next) {
    const authorizationHeader = req.headers.authorization;
    
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing from request headers'
      });
    }
    
    const tokenFromHeader = authorizationHeader.split(' ')[1];
    const tokenValidation = securityManager.decodeSessionToken(tokenFromHeader);
    
    if (!tokenValidation.valid) {
      return res.status(401).json({
        success: false,
        error: 'Session token invalid or expired',
        details: tokenValidation.error
      });
    }
    
    // Attach user credentials to request object
    req.authenticatedUser = {
      userId: tokenValidation.payload.uid,
      email: tokenValidation.payload.emailAddress,
      role: tokenValidation.payload.userRole
    };
    
    next();
  }

  // Verify user has one of the allowed roles
  requireRole(...permittedRoles) {
    return (req, res, next) => {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          success: false,
          error: 'Must authenticate before accessing this resource'
        });
      }
      
      const userHasPermission = permittedRoles.includes(req.authenticatedUser.role);
      
      if (!userHasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient access rights for this operation',
          requiredRoles: permittedRoles,
          currentRole: req.authenticatedUser.role
        });
      }
      
      next();
    };
  }

  // Allow but don't require authentication
  allowOptionalAuth(req, res, next) {
    const authorizationHeader = req.headers.authorization;
    
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const tokenFromHeader = authorizationHeader.split(' ')[1];
      const tokenValidation = securityManager.decodeSessionToken(tokenFromHeader);
      
      if (tokenValidation.valid) {
        req.authenticatedUser = {
          userId: tokenValidation.payload.uid,
          email: tokenValidation.payload.emailAddress,
          role: tokenValidation.payload.userRole
        };
      }
    }
    
    next();
  }
}

// Export singleton
module.exports = new AccessController();
