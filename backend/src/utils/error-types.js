// Custom error classes for the TIKIT system

class ApplicationError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

class ValidationError extends ApplicationError {
  constructor(message, fieldErrors = []) {
    super(message, 400);
    this.fieldErrors = fieldErrors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors
    };
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends ApplicationError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource = 'Resource', identifier = '') {
    const msg = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(msg, 404);
    this.resource = resource;
    this.identifier = identifier;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      identifier: this.identifier
    };
  }
}

class ConflictError extends ApplicationError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

class BusinessRuleError extends ApplicationError {
  constructor(message, ruleViolation = '') {
    super(message, 422);
    this.ruleViolation = ruleViolation;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ruleViolation: this.ruleViolation
    };
  }
}

module.exports = {
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError
};
