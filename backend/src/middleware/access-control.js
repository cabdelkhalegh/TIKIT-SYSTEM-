// TIKIT Access Control Layer (V2 — multi-role support via UserRole junction table)
const securityManager = require('../utils/security-manager');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
      role: tokenValidation.payload.userRole // Legacy single role from JWT
    };

    next();
  }

  // Verify user has one of the allowed roles (legacy single-role check)
  requireRole(...permittedRoles) {
    // Flatten in case an array is passed as single arg
    const roles = permittedRoles.flat();
    return (req, res, next) => {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          success: false,
          error: 'Must authenticate before accessing this resource'
        });
      }

      const userHasPermission = roles.includes(req.authenticatedUser.role);

      if (!userHasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient access rights for this operation',
          requiredRoles: roles,
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

  // ─── V2 Multi-Role Helpers ─────────────────────────────────────────────────

  /**
   * Check if user has a specific role (queries UserRole junction table)
   */
  async hasRole(req, roleName) {
    if (!req.authenticatedUser) return false;
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_role: {
          userId: req.authenticatedUser.userId,
          role: roleName,
        }
      }
    });
    return !!userRole;
  }

  /**
   * Check if user has ANY of the specified roles (union check)
   */
  async hasAnyRole(req, roles) {
    if (!req.authenticatedUser) return false;
    const count = await prisma.userRole.count({
      where: {
        userId: req.authenticatedUser.userId,
        role: { in: roles },
      }
    });
    return count > 0;
  }

  /**
   * Check if user is a Director
   */
  async isDirector(req) {
    return this.hasRole(req, 'director');
  }

  /**
   * Check if user has any internal role (director, campaign_manager, reviewer, finance)
   */
  async isInternalUser(req) {
    return this.hasAnyRole(req, ['director', 'campaign_manager', 'reviewer', 'finance']);
  }

  /**
   * Middleware: require user has ANY of the given V2 roles (via UserRole table)
   * Supports multi-role union: if user has ANY of the allowed roles, access granted
   */
  requireV2Role(...allowedRoles) {
    const roles = allowedRoles.flat();
    return async (req, res, next) => {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          success: false,
          error: 'Must authenticate before accessing this resource'
        });
      }

      const hasAccess = await this.hasAnyRole(req, roles);
      if (!hasAccess) {
        // Fallback: check legacy single role field too
        if (roles.includes(req.authenticatedUser.role)) {
          return next();
        }
        return res.status(403).json({
          success: false,
          error: 'Insufficient access rights for this operation',
          requiredRoles: roles,
        });
      }

      next();
    };
  }
}

// Export singleton
module.exports = new AccessController();
