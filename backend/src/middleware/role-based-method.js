/**
 * Role-Based Access Control Middleware Factory
 * Creates reusable middleware for role-based authorization on HTTP methods
 */

const { requireRole } = require('../middleware/access-control');

/**
 * Creates middleware that applies role-based access control based on HTTP method
 * @param {Object} roleConfig - Configuration object mapping method types to required roles
 * @param {string[]} roleConfig.mutation - Roles allowed for POST/PUT methods
 * @param {string[]} roleConfig.delete - Roles allowed for DELETE method
 * @returns {Function} Express middleware function
 */
function createRoleBasedMethodMiddleware(roleConfig) {
  const { mutation = [], delete: deleteRoles = [] } = roleConfig;
  
  return (req, res, next) => {
    const mutationMethods = ['POST', 'PUT'];
    const deleteMethods = ['DELETE'];
    
    if (mutationMethods.includes(req.method) && mutation.length > 0) {
      return requireRole(mutation)(req, res, next);
    }
    
    if (deleteMethods.includes(req.method) && deleteRoles.length > 0) {
      return requireRole(deleteRoles)(req, res, next);
    }
    
    next();
  };
}

module.exports = createRoleBasedMethodMiddleware;
