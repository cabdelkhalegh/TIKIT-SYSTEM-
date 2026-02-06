const express = require('express');
const { Pool } = require('pg');
const prisma = require('./prismaClient');
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
    features: ['Docker', 'PostgreSQL', 'Prisma ORM']
  });
});

// ============= PRISMA-BASED API ENDPOINTS =============

// Users endpoints
app.get('/api/users', async (req, res) => {
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

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { tickets: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    const user = await prisma.user.create({
      data: { email, name, password, role }
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Tickets endpoints
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
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

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true }
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, status, priority, userId } = req.body;
    const ticket = await prisma.ticket.create({
      data: { title, description, status, priority, userId: parseInt(userId) },
      include: { user: true }
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description, status, priority },
      include: { user: true }
    });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    await prisma.ticket.delete({
      where: { id: parseInt(req.params.id) }
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

