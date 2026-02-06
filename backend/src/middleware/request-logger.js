// Request logger middleware for the TIKIT system

function requestLogger(req, res, next) {
  const requestStartTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach request ID to request object
  req.id = requestId;

  // Log request details
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'unknown';

  // Color codes for console output
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
  };

  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${method}${colors.reset} ${url}`);
  console.log(`  ${colors.yellow}ID:${colors.reset} ${requestId}`);
  console.log(`  ${colors.yellow}IP:${colors.reset} ${ip}`);
  
  if (req.user) {
    console.log(`  ${colors.yellow}User:${colors.reset} ${req.user.email} (${req.user.role})`);
  }

  // Log request body for POST/PUT/PATCH (excluding sensitive fields)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields from logs
    delete sanitizedBody.password;
    delete sanitizedBody.currentPassword;
    delete sanitizedBody.newPassword;
    delete sanitizedBody.token;
    
    console.log(`  ${colors.yellow}Body:${colors.reset}`, JSON.stringify(sanitizedBody, null, 2));
  }

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`  ${colors.yellow}Query:${colors.reset}`, JSON.stringify(req.query));
  }

  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - requestStartTime;
    const statusCode = res.statusCode;
    
    let statusColor;
    if (statusCode >= 500) {
      statusColor = colors.red;
    } else if (statusCode >= 400) {
      statusColor = colors.yellow;
    } else if (statusCode >= 300) {
      statusColor = colors.magenta;
    } else {
      statusColor = colors.green;
    }

    console.log(`  ${colors.yellow}Status:${colors.reset} ${statusColor}${statusCode}${colors.reset}`);
    console.log(`  ${colors.yellow}Duration:${colors.reset} ${duration}ms`);
    console.log('');

    return originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
