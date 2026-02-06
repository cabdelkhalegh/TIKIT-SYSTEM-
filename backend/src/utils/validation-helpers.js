// Validation helper functions for the TIKIT system

class DataValidator {
  // Email validation using RFC 5322 simplified pattern
  static isValidEmail(emailAddress) {
    if (!emailAddress || typeof emailAddress !== 'string') return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailAddress.trim());
  }

  // URL validation for http/https protocols
  static isValidURL(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
      const parsedURL = new URL(urlString);
      return parsedURL.protocol === 'http:' || parsedURL.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Date validation and parsing
  static isValidDate(dateValue) {
    if (!dateValue) return false;
    const parsedDate = new Date(dateValue);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  // Check if date is in the future
  static isFutureDate(dateValue) {
    if (!this.isValidDate(dateValue)) return false;
    const parsedDate = new Date(dateValue);
    const currentTime = new Date();
    return parsedDate > currentTime;
  }

  // Check if date is in the past
  static isPastDate(dateValue) {
    if (!this.isValidDate(dateValue)) return false;
    const parsedDate = new Date(dateValue);
    const currentTime = new Date();
    return parsedDate < currentTime;
  }

  // Validate date range (start before end)
  static isValidDateRange(startDate, endDate) {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }

  // Number validation within range
  static isNumberInRange(numValue, minValue, maxValue) {
    if (typeof numValue !== 'number' || isNaN(numValue)) return false;
    return numValue >= minValue && numValue <= maxValue;
  }

  // Positive number validation
  static isPositiveNumber(numValue) {
    return typeof numValue === 'number' && !isNaN(numValue) && numValue > 0;
  }

  // Non-negative number validation
  static isNonNegativeNumber(numValue) {
    return typeof numValue === 'number' && !isNaN(numValue) && numValue >= 0;
  }

  // String length validation
  static isValidStringLength(strValue, minLen, maxLen) {
    if (!strValue || typeof strValue !== 'string') return false;
    const trimmedStr = strValue.trim();
    return trimmedStr.length >= minLen && trimmedStr.length <= maxLen;
  }

  // Alphanumeric validation
  static isAlphanumeric(strValue) {
    if (!strValue || typeof strValue !== 'string') return false;
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;
    return alphanumericPattern.test(strValue);
  }

  // Phone number validation (basic international format)
  static isValidPhone(phoneNum) {
    if (!phoneNum || typeof phoneNum !== 'string') return false;
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    return phonePattern.test(phoneNum.replace(/[\s\-\(\)]/g, ''));
  }

  // Social media handle validation
  static isValidSocialHandle(handleStr) {
    if (!handleStr || typeof handleStr !== 'string') return false;
    const handlePattern = /^@?[a-zA-Z0-9_\.]{1,30}$/;
    return handlePattern.test(handleStr.trim());
  }

  // Platform validation
  static isValidPlatform(platformName) {
    const validPlatforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];
    return typeof platformName === 'string' && 
           validPlatforms.includes(platformName.toLowerCase());
  }

  // Campaign status validation
  static isValidCampaignStatus(statusValue) {
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'];
    return typeof statusValue === 'string' && validStatuses.includes(statusValue.toLowerCase());
  }

  // Collaboration status validation
  static isValidCollaborationStatus(statusValue) {
    const validStatuses = ['invited', 'accepted', 'declined', 'active', 'completed', 'cancelled'];
    return typeof statusValue === 'string' && validStatuses.includes(statusValue.toLowerCase());
  }

  // Payment status validation
  static isValidPaymentStatus(statusValue) {
    const validStatuses = ['pending', 'partial', 'paid'];
    return typeof statusValue === 'string' && validStatuses.includes(statusValue.toLowerCase());
  }

  // User role validation
  static isValidUserRole(roleValue) {
    const validRoles = ['admin', 'client_manager', 'influencer_manager'];
    return typeof roleValue === 'string' && validRoles.includes(roleValue.toLowerCase());
  }

  // Availability status validation
  static isValidAvailability(availValue) {
    const validAvailability = ['available', 'busy', 'unavailable'];
    return typeof availValue === 'string' && validAvailability.includes(availValue.toLowerCase());
  }

  // Budget validation (min $100, max $10M)
  static isValidBudget(budgetAmount) {
    return this.isNumberInRange(budgetAmount, 100, 10000000);
  }

  // Engagement rate validation (0-100%)
  static isValidEngagementRate(rateValue) {
    return this.isNumberInRange(rateValue, 0, 100);
  }

  // Follower count validation
  static isValidFollowerCount(countValue) {
    return this.isPositiveNumber(countValue) && countValue <= 1000000000; // Max 1B
  }

  // Quality score validation (0-100)
  static isValidQualityScore(scoreValue) {
    return this.isNumberInRange(scoreValue, 0, 100);
  }

  // Array validation
  static isNonEmptyArray(arrayValue) {
    return Array.isArray(arrayValue) && arrayValue.length > 0;
  }

  // UUID validation
  static isValidUUID(uuidStr) {
    if (!uuidStr || typeof uuidStr !== 'string') return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuidStr);
  }

  // Sanitize string (trim and basic XSS prevention)
  static sanitizeString(strValue) {
    if (!strValue || typeof strValue !== 'string') return '';
    return strValue.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Normalize social handle (remove @ if present)
  static normalizeSocialHandle(handleStr) {
    if (!handleStr || typeof handleStr !== 'string') return '';
    return handleStr.trim().replace(/^@/, '');
  }
}

module.exports = DataValidator;
