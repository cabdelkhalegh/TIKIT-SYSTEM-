// TIKIT User Account Manager
const { PrismaClient } = require('@prisma/client');
const securityManager = require('../utils/security-manager');

const dbClient = new PrismaClient();

class UserAccountManager {
  // Create new user account in system
  async createUserAccount(req, res) {
    try {
      const { email, password, fullName, displayName, role } = req.body;
      
      // Check for existing account with same email
      const existingAccount = await dbClient.user.findUnique({
        where: { email: email }
      });
      
      if (existingAccount) {
        return res.status(409).json({
          success: false,
          error: 'Account with this email address already registered'
        });
      }
      
      // Encrypt the password before storage
      const encryptedPassword = await securityManager.encryptUserPassword(password);
      
      // Create new user record
      const newUserAccount = await dbClient.user.create({
        data: {
          email: email,
          passwordHash: encryptedPassword,
          fullName: fullName,
          displayName: displayName || fullName,
          role: role || 'client_manager'
        },
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true
        }
      });
      
      // Issue session token for new user
      const sessionToken = securityManager.createSessionToken(newUserAccount);
      
      res.status(201).json({
        success: true,
        message: 'New user account created successfully',
        data: {
          userAccount: newUserAccount,
          authToken: sessionToken
        }
      });
    } catch (err) {
      console.error('Account creation failed:', err);
      res.status(500).json({
        success: false,
        error: 'Unable to create user account'
      });
    }
  }

  // Authenticate user and create session
  async authenticateUser(req, res) {
    try {
      const { email, password } = req.body;
      
      // Lookup user account by email
      const userAccount = await dbClient.user.findUnique({
        where: { email: email }
      });
      
      if (!userAccount) {
        return res.status(401).json({
          success: false,
          error: 'Authentication credentials are invalid'
        });
      }
      
      // Verify account is not disabled
      if (userAccount.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'User account has been deactivated'
        });
      }
      
      // Validate password matches stored hash
      const passwordMatches = await securityManager.validateUserPassword(
        password,
        userAccount.passwordHash
      );
      
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          error: 'Authentication credentials are invalid'
        });
      }
      
      // Record login timestamp
      await dbClient.user.update({
        where: { userId: userAccount.userId },
        data: { lastLoginAt: new Date() }
      });
      
      // Generate session token
      const sessionToken = securityManager.createSessionToken(userAccount);
      
      // Remove sensitive fields before sending response
      const { passwordHash, passwordResetToken, passwordResetExpires, 
              emailVerificationToken, ...safeUserData } = userAccount;
      
      res.json({
        success: true,
        message: 'User authenticated successfully',
        data: {
          userAccount: safeUserData,
          authToken: sessionToken
        }
      });
    } catch (err) {
      console.error('Authentication failed:', err);
      res.status(500).json({
        success: false,
        error: 'Authentication process encountered an error'
      });
    }
  }

  // Fetch current user account details
  async fetchUserProfile(req, res) {
    try {
      const currentUserId = req.authenticatedUser.userId;
      
      const userProfile = await dbClient.user.findUnique({
        where: { userId: currentUserId },
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          profileImageUrl: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          managedClientId: true,
          managedInfluencerId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          managedClient: {
            select: {
              clientId: true,
              brandDisplayName: true,
              legalCompanyName: true
            }
          },
          managedInfluencer: {
            select: {
              influencerId: true,
              displayName: true,
              fullName: true
            }
          }
        }
      });
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found in system'
        });
      }
      
      res.json({
        success: true,
        data: userProfile
      });
    } catch (err) {
      console.error('Profile fetch failed:', err);
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve user profile'
      });
    }
  }

  // Modify user profile information
  async modifyUserProfile(req, res) {
    try {
      const currentUserId = req.authenticatedUser.userId;
      const { fullName, displayName, profileImageUrl } = req.body;
      
      const updatedFields = {};
      if (fullName !== undefined) updatedFields.fullName = fullName;
      if (displayName !== undefined) updatedFields.displayName = displayName;
      if (profileImageUrl !== undefined) updatedFields.profileImageUrl = profileImageUrl;
      
      const updatedProfile = await dbClient.user.update({
        where: { userId: currentUserId },
        data: updatedFields,
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          profileImageUrl: true,
          role: true,
          updatedAt: true
        }
      });
      
      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedProfile
      });
    } catch (err) {
      console.error('Profile update failed:', err);
      res.status(500).json({
        success: false,
        error: 'Unable to update user profile'
      });
    }
  }

  // Update user password
  async updateUserPassword(req, res) {
    try {
      const currentUserId = req.authenticatedUser.userId;
      const { currentPassword, newPassword } = req.body;
      
      // Fetch user with password hash
      const userAccount = await dbClient.user.findUnique({
        where: { userId: currentUserId }
      });
      
      // Verify current password is correct
      const currentPasswordValid = await securityManager.validateUserPassword(
        currentPassword,
        userAccount.passwordHash
      );
      
      if (!currentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password provided is incorrect'
        });
      }
      
      // Encrypt new password
      const encryptedNewPassword = await securityManager.encryptUserPassword(newPassword);
      
      // Save new password
      await dbClient.user.update({
        where: { userId: currentUserId },
        data: { passwordHash: encryptedNewPassword }
      });
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (err) {
      console.error('Password update failed:', err);
      res.status(500).json({
        success: false,
        error: 'Unable to update password'
      });
    }
  }
}

module.exports = new UserAccountManager();
