/**
 * Role-Based Access Control Middleware Factory (V2)
 * Supports array of allowed roles per route with multi-role union check
 * If user has ANY of the allowed roles for the method, access is granted
 */

const accessController = require('./access-control');

/**
 * Creates middleware that applies role-based access control based on HTTP method
 * @param {Object} roleConfig - Configuration object mapping method types to required roles
 * @param {string[]} roleConfig.mutation - Roles allowed for POST/PUT/PATCH methods
 * @param {string[]} roleConfig.delete - Roles allowed for DELETE method
 * @param {string[]} roleConfig.read - Roles allowed for GET methods (optional, defaults to all authenticated)
 * @returns {Function} Express middleware function
 */
function createRoleBasedMethodMiddleware(roleConfig) {
  const {
    mutation = [],
    delete: deleteRoles = [],
    read = [],
  } = roleConfig;

  return async (req, res, next) => {
    const mutationMethods = ['POST', 'PUT', 'PATCH'];
    const deleteMethods = ['DELETE'];
    const readMethods = ['GET'];

    let requiredRoles = [];

    if (mutationMethods.includes(req.method) && mutation.length > 0) {
      requiredRoles = mutation;
    } else if (deleteMethods.includes(req.method) && deleteRoles.length > 0) {
      requiredRoles = deleteRoles;
    } else if (readMethods.includes(req.method) && read.length > 0) {
      requiredRoles = read;
    } else {
      // No role restriction for this method
      return next();
    }

    // First try V2 multi-role check (UserRole junction table)
    if (req.authenticatedUser) {
      const hasAccess = await accessController.hasAnyRole(req, requiredRoles);
      if (hasAccess) {
        return next();
      }

      // Fallback: check legacy single role field
      if (requiredRoles.includes(req.authenticatedUser.role)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Insufficient access rights for this operation',
      requiredRoles,
      method: req.method,
    });
  };
}

module.exports = createRoleBasedMethodMiddleware;
