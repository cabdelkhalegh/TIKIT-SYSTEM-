require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'TIKIT Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api/tickets', (req, res) => {
  res.json({ 
    tickets: [],
    message: 'Ticket list endpoint - ready for implementation'
  });
});

app.post('/api/tickets', (req, res) => {
  res.json({ 
    message: 'Create ticket endpoint - ready for implementation',
    received: req.body
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TIKIT Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
