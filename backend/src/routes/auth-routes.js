// TIKIT Authentication Routes
const express = require('express');
const { body } = require('express-validator');
const userAccountManager = require('../controllers/user-account-manager');
const accessControl = require('../middleware/access-control');
const inputValidator = require('../middleware/input-validator');

const authRouter = express.Router();

// Validation rules for registration
const registrationRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('role').optional().isIn(['admin', 'client_manager', 'influencer_manager']).withMessage('Invalid role specified')
];

// Validation rules for login
const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation rules for password change
const passwordChangeRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Validation rules for profile update
const profileUpdateRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('displayName').optional().trim(),
  body('profileImageUrl').optional().isURL().withMessage('Profile image must be valid URL')
];

// Public routes
authRouter.post(
  '/register',
  registrationRules,
  inputValidator.checkValidationErrors,
  userAccountManager.createUserAccount.bind(userAccountManager)
);

authRouter.post(
  '/login',
  loginRules,
  inputValidator.checkValidationErrors,
  userAccountManager.authenticateUser.bind(userAccountManager)
);

// Protected routes (require authentication)
authRouter.get(
  '/profile',
  accessControl.requireAuthentication.bind(accessControl),
  userAccountManager.fetchUserProfile.bind(userAccountManager)
);

authRouter.put(
  '/profile',
  accessControl.requireAuthentication.bind(accessControl),
  profileUpdateRules,
  inputValidator.checkValidationErrors,
  userAccountManager.modifyUserProfile.bind(userAccountManager)
);

authRouter.post(
  '/change-password',
  accessControl.requireAuthentication.bind(accessControl),
  passwordChangeRules,
  inputValidator.checkValidationErrors,
  userAccountManager.updateUserPassword.bind(userAccountManager)
);

module.exports = authRouter;
