/**
 * Validation helpers for API requests
 */

/**
 * Validate that an ID is a positive integer
 * @param {string|number} id - The ID to validate
 * @returns {number|null} - Returns the parsed ID if valid, null otherwise
 */
function validateId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * Validate user creation data
 * @param {Object} data - User data to validate
 * @returns {Object} - { valid: boolean, errors: array }
 */
function validateUserData(data) {
  const errors = [];
  
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (data.name && typeof data.name !== 'string') {
    errors.push('Name must be a string');
  }
  
  if (data.role && !['user', 'admin'].includes(data.role)) {
    errors.push('Role must be either "user" or "admin"');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate ticket creation/update data
 * @param {Object} data - Ticket data to validate
 * @param {boolean} isUpdate - Whether this is an update (some fields optional)
 * @returns {Object} - { valid: boolean, errors: array }
 */
function validateTicketData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!data.userId || typeof data.userId !== 'number') {
      errors.push('Valid userId is required');
    }
  }
  
  if (data.title && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
    errors.push('Title must be a non-empty string');
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  if (data.status && !['open', 'in-progress', 'completed', 'closed'].includes(data.status)) {
    errors.push('Status must be one of: open, in-progress, completed, closed');
  }
  
  if (data.priority && !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
    errors.push('Priority must be one of: low, medium, high, critical');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateId,
  validateUserData,
  validateTicketData
};
