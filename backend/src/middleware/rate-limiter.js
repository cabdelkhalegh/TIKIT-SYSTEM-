// Rate limiting middleware for the TIKIT system

const rateLimitStore = new Map();

function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    maxRequests = 100, // 100 requests per window default
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => {
      // Use IP address as default key
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  } = options;

  return function rateLimiter(req, res, next) {
    const clientKey = keyGenerator(req);
    const currentTime = Date.now();
    
    // Get or initialize client record
    let clientData = rateLimitStore.get(clientKey);
    
    if (!clientData) {
      clientData = {
        count: 0,
        resetTime: currentTime + windowMs
      };
      rateLimitStore.set(clientKey, clientData);
    }

    // Reset if window has expired
    if (currentTime > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = currentTime + windowMs;
    }

    // Increment request count
    clientData.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - clientData.count);
    const resetTime = new Date(clientData.resetTime);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

    // Check if limit exceeded
    if (clientData.count > maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - currentTime) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        error: 'RateLimitExceeded',
        message,
        statusCode: 429,
        retryAfter: retryAfter,
        limit: maxRequests,
        windowMs: windowMs
      });
    }

    // If configured to skip successful requests, decrement on success
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          clientData.count = Math.max(0, clientData.count - 1);
        }
      });
    }

    next();
  };
}

// Clean up old entries periodically (every hour)
setInterval(() => {
  const currentTime = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (currentTime > data.resetTime + 3600000) { // 1 hour past reset
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

module.exports = createRateLimiter;
