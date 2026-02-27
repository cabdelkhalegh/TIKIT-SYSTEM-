// TIKIT Authentication Routes — Phase 6 US4 Enhanced
// T055: Multi-step signup, password validation, account lockout, session timeout, Instagram OAuth
const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const securityManager = require('../utils/security-manager');
const accessControl = require('../middleware/access-control');
const inputValidator = require('../middleware/input-validator');
const geminiService = require('../services/gemini-service');

const prisma = new PrismaClient();
const authRouter = express.Router();

// ─── Password Complexity Validator ──────────────────────────────────────────
function validatePasswordComplexity(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  return errors;
}

// ─── Lockout Constants ──────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Validation Rules ───────────────────────────────────────────────────────

const registrationStep1Rules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const passwordChangeRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

const profileUpdateRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('displayName').optional().trim(),
  body('profileImageUrl').optional().isURL().withMessage('Profile image must be valid URL'),
];

// ─── Session Timeout Middleware ─────────────────────────────────────────────
async function checkSessionTimeout(req, res, next) {
  if (!req.authenticatedUser) return next();

  try {
    const user = await prisma.user.findUnique({
      where: { userId: req.authenticatedUser.userId },
      select: { lastLoginAt: true },
    });

    if (user && user.lastLoginAt) {
      const timeSinceActivity = Date.now() - new Date(user.lastLoginAt).getTime();
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        return res.status(401).json({
          success: false,
          error: 'Session expired due to inactivity. Please log in again.',
        });
      }
    }

    // Update last activity timestamp
    await prisma.user.update({
      where: { userId: req.authenticatedUser.userId },
      data: { lastLoginAt: new Date() },
    });

    next();
  } catch (err) {
    next();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Step 1: Register (email + password + name) ─────────────────────────────
authRouter.post(
  '/register',
  registrationStep1Rules,
  inputValidator.checkValidationErrors,
  async (req, res) => {
    try {
      const { email, password, fullName, phone } = req.body;

      // Check for existing account
      const existingAccount = await prisma.user.findUnique({ where: { email } });
      if (existingAccount) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
      }

      // Validate password complexity
      const pwErrors = validatePasswordComplexity(password);
      if (pwErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Validation failed: ${pwErrors.join(', ')}`,
        });
      }

      const encryptedPassword = await securityManager.encryptUserPassword(password);

      // Create user in pending state (isActive=false, no role assigned)
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: encryptedPassword,
          fullName,
          displayName: fullName,
          phone: phone || null,
          role: 'client_manager', // legacy field — actual role assigned via UserRole on approval
          isActive: false, // Pending approval
        },
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create a CompanyRegistration record in pending status
      const registration = await prisma.companyRegistration.create({
        data: {
          userId: newUser.userId,
          status: 'pending',
        },
      });

      // Issue a temporary session token for file upload in step 2
      const sessionToken = securityManager.createSessionToken({
        userId: newUser.userId,
        email: newUser.email,
        role: 'pending',
      });

      res.status(201).json({
        success: true,
        data: {
          id: newUser.userId,
          email: newUser.email,
          displayName: newUser.displayName,
          isActive: false,
          registration: {
            id: registration.id,
            status: registration.status,
          },
          token: sessionToken,
        },
      });
    } catch (err) {
      console.error('Registration step 1 failed:', err);
      res.status(500).json({ success: false, error: 'Unable to create user account' });
    }
  }
);

// ─── Step 2: Upload trade license + AI extraction ───────────────────────────
authRouter.post(
  '/register/step-2',
  accessControl.requireAuthentication.bind(accessControl),
  async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { licenseFileUrl } = req.body;

      if (!licenseFileUrl) {
        return res.status(400).json({
          success: false,
          error: 'licenseFileUrl is required',
        });
      }

      const registration = await prisma.companyRegistration.findUnique({
        where: { userId },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found. Please start from step 1.',
        });
      }

      // Run AI extraction on the trade license
      const extraction = await geminiService.extractTradeLicense(licenseFileUrl);

      let extractedData = {};
      if (extraction.success && extraction.data) {
        extractedData = extraction.data;
      }

      // Save extracted data + file URL to registration
      await prisma.companyRegistration.update({
        where: { id: registration.id },
        data: {
          licenseFileUrl,
          companyName: extractedData.companyName || null,
          vatTrnNumber: extractedData.vatTrnNumber || null,
          licenseNumber: extractedData.licenseNumber || null,
          expiryDate: extractedData.expiryDate ? new Date(extractedData.expiryDate) : null,
          businessAddress: extractedData.businessAddress || null,
          activities: extractedData.activities ? JSON.stringify(extractedData.activities) : null,
          ownerNames: extractedData.ownerNames ? JSON.stringify(extractedData.ownerNames) : null,
        },
      });

      res.json({
        success: true,
        data: {
          registrationId: registration.id,
          extraction: extraction.success ? extractedData : null,
          extractionSuccess: extraction.success,
          fallbackRequired: extraction.fallbackRequired || false,
          confidenceScores: extractedData.confidenceScores || null,
        },
      });
    } catch (err) {
      console.error('Registration step 2 failed:', err);
      res.status(500).json({ success: false, error: 'Trade license processing failed' });
    }
  }
);

// ─── Step 3: Review extracted data (user can edit) ──────────────────────────
authRouter.post(
  '/register/step-3',
  accessControl.requireAuthentication.bind(accessControl),
  async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { companyName, vatTrnNumber, licenseNumber, expiryDate, businessAddress, activities, ownerNames } = req.body;

      const registration = await prisma.companyRegistration.findUnique({
        where: { userId },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found. Please start from step 1.',
        });
      }

      // Update with reviewed/edited data
      const updated = await prisma.companyRegistration.update({
        where: { id: registration.id },
        data: {
          companyName: companyName || registration.companyName,
          vatTrnNumber: vatTrnNumber || registration.vatTrnNumber,
          licenseNumber: licenseNumber || registration.licenseNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : registration.expiryDate,
          businessAddress: businessAddress || registration.businessAddress,
          activities: activities ? JSON.stringify(activities) : registration.activities,
          ownerNames: ownerNames ? JSON.stringify(ownerNames) : registration.ownerNames,
        },
        select: {
          id: true,
          companyName: true,
          vatTrnNumber: true,
          licenseNumber: true,
          expiryDate: true,
          businessAddress: true,
          activities: true,
          ownerNames: true,
          licenseFileUrl: true,
          status: true,
        },
      });

      res.json({
        success: true,
        data: {
          ...updated,
          activities: updated.activities ? JSON.parse(updated.activities) : [],
          ownerNames: updated.ownerNames ? JSON.parse(updated.ownerNames) : [],
        },
      });
    } catch (err) {
      console.error('Registration step 3 failed:', err);
      res.status(500).json({ success: false, error: 'Review update failed' });
    }
  }
);

// ─── Final Submit: Mark registration as pending_approval ────────────────────
authRouter.post(
  '/register/submit',
  accessControl.requireAuthentication.bind(accessControl),
  async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;

      const registration = await prisma.companyRegistration.findUnique({
        where: { userId },
        include: { user: { select: { email: true, fullName: true, displayName: true } } },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found. Please start from step 1.',
        });
      }

      res.json({
        success: true,
        data: {
          id: registration.user.email,
          registrationId: registration.id,
          status: 'pending_approval',
          message: 'Registration submitted. Please wait for Director approval before logging in.',
        },
      });
    } catch (err) {
      console.error('Registration submit failed:', err);
      res.status(500).json({ success: false, error: 'Registration submission failed' });
    }
  }
);

// ─── Login (with lockout + session tracking) ────────────────────────────────
authRouter.post(
  '/login',
  loginRules,
  inputValidator.checkValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const userAccount = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: { select: { role: true } },
        },
      });

      if (!userAccount) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check lockout
      if (userAccount.lockedUntil && new Date(userAccount.lockedUntil) > new Date()) {
        const lockedUntil = new Date(userAccount.lockedUntil).toISOString();
        return res.status(423).json({
          success: false,
          error: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Try again after ${lockedUntil}`,
          lockedUntil,
        });
      }

      // Clear expired lockout
      if (userAccount.lockedUntil && new Date(userAccount.lockedUntil) <= new Date()) {
        await prisma.user.update({
          where: { userId: userAccount.userId },
          data: { lockedUntil: null, failedLoginCount: 0 },
        });
        userAccount.failedLoginCount = 0;
        userAccount.lockedUntil = null;
      }

      // Check if account is pending approval
      if (userAccount.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Account pending approval',
        });
      }

      // Validate password
      const passwordMatches = await securityManager.validateUserPassword(
        password,
        userAccount.passwordHash
      );

      if (!passwordMatches) {
        const newFailCount = (userAccount.failedLoginCount || 0) + 1;
        const updateData = { failedLoginCount: newFailCount };

        if (newFailCount >= MAX_FAILED_ATTEMPTS) {
          updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }

        await prisma.user.update({
          where: { userId: userAccount.userId },
          data: updateData,
        });

        const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailCount;
        if (newFailCount >= MAX_FAILED_ATTEMPTS) {
          return res.status(423).json({
            success: false,
            error: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Try again after 15 minutes.`,
            lockedUntil: updateData.lockedUntil.toISOString(),
          });
        }

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          remainingAttempts,
        });
      }

      // Successful login — reset failed attempts, update last login
      await prisma.user.update({
        where: { userId: userAccount.userId },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      // Build roles array from UserRole junction table
      const roles = userAccount.roles.map((r) => r.role);

      // Generate session token with roles
      const sessionToken = securityManager.createSessionToken({
        userId: userAccount.userId,
        email: userAccount.email,
        role: roles[0] || userAccount.role, // legacy single role
        roles, // V2 multi-role
      });

      // Remove sensitive fields
      const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken,
        failedLoginCount, lockedUntil, ...safeUserData } = userAccount;

      res.json({
        success: true,
        data: {
          accessToken: sessionToken,
          expiresIn: 1800,
          user: {
            ...safeUserData,
            id: safeUserData.userId,
            roles,
          },
          // Legacy compat
          userAccount: { ...safeUserData, id: safeUserData.userId, roles },
          authToken: sessionToken,
        },
      });
    } catch (err) {
      console.error('Authentication failed:', err);
      res.status(500).json({
        success: false,
        error: 'Authentication process encountered an error',
      });
    }
  }
);

// ─── Logout ─────────────────────────────────────────────────────────────────
authRouter.post(
  '/logout',
  accessControl.requireAuthentication.bind(accessControl),
  async (req, res) => {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }
);

// ─── Refresh Token ──────────────────────────────────────────────────────────
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }

    const decoded = securityManager.decodeSessionToken(refreshToken);
    if (!decoded.valid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: decoded.payload.uid },
      include: { roles: { select: { role: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const roles = user.roles.map((r) => r.role);
    const newToken = securityManager.createSessionToken({
      userId: user.userId,
      email: user.email,
      role: roles[0] || user.role,
      roles,
    });

    res.json({
      success: true,
      data: {
        accessToken: newToken,
        refreshToken: newToken,
        expiresIn: 1800,
      },
    });
  } catch (err) {
    console.error('Token refresh failed:', err);
    res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

// ─── Forgot Password ────────────────────────────────────────────────────────
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = securityManager.createRandomSecurityToken();
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      console.log(`[Email] Password reset link for ${email}: /reset-password?token=${resetToken}`);
    }

    // Always return 200 to prevent email enumeration
    res.json({
      success: true,
      data: { message: 'If an account with that email exists, a reset link has been sent' },
    });
  } catch (err) {
    console.error('Forgot password failed:', err);
    res.status(500).json({ success: false, error: 'Password reset request failed' });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and newPassword are required' });
    }

    const pwErrors = validatePasswordComplexity(newPassword);
    if (pwErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet complexity requirements',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const encryptedPassword = await securityManager.encryptUserPassword(newPassword);
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash: encryptedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    res.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (err) {
    console.error('Reset password failed:', err);
    res.status(500).json({ success: false, error: 'Password reset failed' });
  }
});

// ─── Instagram OAuth Callback ───────────────────────────────────────────────
authRouter.get(
  '/instagram/callback',
  accessControl.requireAuthentication.bind(accessControl),
  async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ success: false, error: 'Invalid state parameter' });
      }

      const IG_APP_ID = process.env.INSTAGRAM_APP_ID;
      const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
      const IG_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

      if (!IG_APP_ID || !IG_APP_SECRET) {
        console.error('Instagram OAuth not configured');
        return res.redirect('/settings/integrations?status=error&message=Instagram+not+configured');
      }

      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: IG_APP_ID,
          client_secret: IG_APP_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: IG_REDIRECT_URI,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Instagram token exchange failed:', tokenResponse.status);
        return res.redirect('/settings/integrations?status=error&message=Failed+to+exchange+code');
      }

      const tokenData = await tokenResponse.json();

      // Store the Instagram connection
      await prisma.instagramConnection.upsert({
        where: { userId: req.authenticatedUser.userId },
        create: {
          userId: req.authenticatedUser.userId,
          igUserId: String(tokenData.user_id),
          accessToken: tokenData.access_token,
          connectedAt: new Date(),
        },
        update: {
          igUserId: String(tokenData.user_id),
          accessToken: tokenData.access_token,
          connectedAt: new Date(),
        },
      });

      res.redirect('/settings/integrations?status=connected');
    } catch (err) {
      console.error('Instagram OAuth failed:', err);
      res.redirect('/settings/integrations?status=error&message=OAuth+failed');
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

authRouter.get(
  '/profile',
  accessControl.requireAuthentication.bind(accessControl),
  checkSessionTimeout,
  async (req, res) => {
    try {
      const currentUserId = req.authenticatedUser.userId;

      const userProfile = await prisma.user.findUnique({
        where: { userId: currentUserId },
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          profileImageUrl: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          managedClientId: true,
          managedInfluencerId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: { select: { role: true } },
          managedClient: {
            select: { clientId: true, brandDisplayName: true, legalCompanyName: true },
          },
          managedInfluencer: {
            select: { influencerId: true, displayName: true, fullName: true },
          },
          companyRegistration: {
            select: { id: true, companyName: true, status: true },
          },
        },
      });

      if (!userProfile) {
        return res.status(404).json({ success: false, error: 'User profile not found' });
      }

      res.json({
        success: true,
        data: {
          ...userProfile,
          id: userProfile.userId,
          roles: userProfile.roles.map((r) => r.role),
        },
      });
    } catch (err) {
      console.error('Profile fetch failed:', err);
      res.status(500).json({ success: false, error: 'Unable to retrieve user profile' });
    }
  }
);

authRouter.put(
  '/profile',
  accessControl.requireAuthentication.bind(accessControl),
  checkSessionTimeout,
  profileUpdateRules,
  inputValidator.checkValidationErrors,
  async (req, res) => {
    try {
      const currentUserId = req.authenticatedUser.userId;
      const { fullName, displayName, profileImageUrl } = req.body;

      const updatedFields = {};
      if (fullName !== undefined) updatedFields.fullName = fullName;
      if (displayName !== undefined) updatedFields.displayName = displayName;
      if (profileImageUrl !== undefined) updatedFields.profileImageUrl = profileImageUrl;

      const updatedProfile = await prisma.user.update({
        where: { userId: currentUserId },
        data: updatedFields,
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          profileImageUrl: true,
          role: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedProfile,
      });
    } catch (err) {
      console.error('Profile update failed:', err);
      res.status(500).json({ success: false, error: 'Unable to update user profile' });
    }
  }
);

authRouter.post(
  '/change-password',
  accessControl.requireAuthentication.bind(accessControl),
  checkSessionTimeout,
  passwordChangeRules,
  inputValidator.checkValidationErrors,
  async (req, res) => {
    try {
      const currentUserId = req.authenticatedUser.userId;
      const { currentPassword, newPassword } = req.body;

      const pwErrors = validatePasswordComplexity(newPassword);
      if (pwErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Password does not meet complexity requirements: ${pwErrors.join(', ')}`,
        });
      }

      const userAccount = await prisma.user.findUnique({
        where: { userId: currentUserId },
      });

      const currentPasswordValid = await securityManager.validateUserPassword(
        currentPassword,
        userAccount.passwordHash
      );

      if (!currentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password provided is incorrect',
        });
      }

      const encryptedNewPassword = await securityManager.encryptUserPassword(newPassword);
      await prisma.user.update({
        where: { userId: currentUserId },
        data: { passwordHash: encryptedNewPassword },
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      console.error('Password update failed:', err);
      res.status(500).json({ success: false, error: 'Unable to update password' });
    }
  }
);

module.exports = authRouter;
