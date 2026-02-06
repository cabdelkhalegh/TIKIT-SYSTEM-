const express = require('express');
const { Pool } = require('pg');
const prisma = require('./prismaClient');
const { validateId, validateUserData, validateTicketData } = require('./validators');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');
const { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  sanitizeUser 
} = require('./authHelpers');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Legacy database connection (kept for compatibility)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tikit-backend' });
});

// Database connectivity test endpoint
// Note: In production, this endpoint should be rate-limited or removed
// For development/testing purposes, this endpoint is safe to expose
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'connected', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Prisma connectivity test endpoint
app.get('/prisma-test', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const ticketCount = await prisma.ticket.count();
    res.json({ 
      status: 'connected',
      prisma: 'ready',
      stats: {
        users: userCount,
        tickets: ticketCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// API endpoint
app.get('/api/info', (req, res) => {
  res.json({
    app: 'TIKIT System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: ['Docker', 'PostgreSQL', 'Prisma ORM', 'JWT Authentication']
  });
});

// ============= AUTHENTICATION ENDPOINTS =============

// Register new user
app.post('/auth/register', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    
    // Validate input
    const validation = validateUserData({ email, name, password, role });
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'A user with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: { 
        email, 
        name, 
        password: hashedPassword, 
        role: role || 'user' 
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user without password
    const safeUser = sanitizeUser(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user without password
    const safeUser = sanitizeUser(user);

    res.json({
      message: 'Login successful',
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get current user profile
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safeUser = sanitizeUser(user);
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (client should delete token, this is just for consistency)
app.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Logout successful',
    note: 'Please delete the token on the client side' 
  });
});

// ============= PRISMA-BASED API ENDPOINTS =============

// Users endpoints (Protected - Admin only for list, authenticated for own profile)
app.get('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { tickets: true }
        }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.userId !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only view your own profile' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: { tickets: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password back
    const safeUser = sanitizeUser(user);
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Note: User creation is now handled by /auth/register endpoint
// This endpoint is removed in favor of the authentication flow

// Tickets endpoints (Protected - must be authenticated)
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    // Regular users can only see their own tickets, admins see all
    const where = req.user.role === 'admin' 
      ? {} 
      : { userId: req.user.userId };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Users can only view their own tickets or admins can view any
    if (req.user.role !== 'admin' && ticket.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only view your own tickets' 
      });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    
    // Use authenticated user's ID
    const userId = req.user.userId;
    
    // Validate input
    const validation = validateTicketData({ 
      title, 
      description, 
      status, 
      priority, 
      userId 
    });
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const ticket = await prisma.ticket.create({
      data: { title, description, status, priority, userId },
      include: { user: true }
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Check if ticket exists and user has permission
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Users can only update their own tickets, admins can update any
    if (req.user.role !== 'admin' && existingTicket.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only update your own tickets' 
      });
    }
    
    const { title, description, status, priority } = req.body;
    
    // Validate input
    const validation = validateTicketData({ title, description, status, priority }, true);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { title, description, status, priority },
      include: { user: true }
    });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    // Check if ticket exists and user has permission
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Users can only delete their own tickets, admins can delete any
    if (req.user.role !== 'admin' && existingTicket.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own tickets' 
      });
    }
    
    await prisma.ticket.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`TIKIT Backend running on port ${port}`);
  // Note: Binding to 0.0.0.0 is required for Docker containers to accept
  // connections from outside the container. This is standard Docker practice.
  console.log(`✅ Prisma ORM enabled`);
});

