// TIKIT Security Manager - Handles cryptographic operations and session tokens
const bcryptLib = require('bcryptjs');
const jwtLib = require('jsonwebtoken');

class TikitSecurityManager {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'tikit-dev-secret-key-change-me';
    this.tokenLifespan = process.env.JWT_EXPIRES_IN || '7d';
    this.bcryptRounds = 10;
  }

  // Encrypt user password using bcrypt algorithm
  async encryptUserPassword(plainTextPassword) {
    const encryptedHash = await bcryptLib.hash(plainTextPassword, this.bcryptRounds);
    return encryptedHash;
  }

  // Validate provided password against stored hash
  async validateUserPassword(providedPassword, storedHash) {
    const isMatchingPassword = await bcryptLib.compare(providedPassword, storedHash);
    return isMatchingPassword;
  }

  // Create session token for authenticated user
  createSessionToken(userCredentials) {
    const tokenPayload = {
      uid: userCredentials.userId,
      emailAddress: userCredentials.email,
      userRole: userCredentials.role,
      timestamp: Date.now()
    };
    
    const sessionToken = jwtLib.sign(tokenPayload, this.secretKey, {
      expiresIn: this.tokenLifespan
    });
    
    return sessionToken;
  }

  // Decode and validate session token
  decodeSessionToken(tokenString) {
    try {
      const decodedData = jwtLib.verify(tokenString, this.secretKey);
      return { valid: true, payload: decodedData };
    } catch (err) {
      return { valid: false, payload: null, error: err.message };
    }
  }

  // Create verification or reset token
  createRandomSecurityToken() {
    const cryptoLib = require('crypto');
    const randomToken = cryptoLib.randomBytes(32).toString('hex');
    return randomToken;
  }
}

// Export singleton instance
module.exports = new TikitSecurityManager();
