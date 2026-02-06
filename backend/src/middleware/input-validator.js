// Request Input Validator
const { validationResult } = require('express-validator');

class InputValidator {
  checkValidationErrors(req, res, next) {
    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
      const formattedErrors = validationErrors.array().map(error => ({
        fieldName: error.path || error.param,
        errorMessage: error.msg,
        receivedValue: error.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Request validation failed',
        validationErrors: formattedErrors
      });
    }
    
    next();
  }
}

module.exports = new InputValidator();
