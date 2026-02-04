const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for tickets
let tickets = [
  {
    id: 1,
    title: 'Sample Ticket',
    description: 'This is a sample ticket',
    status: 'open',
    priority: 'medium',
    createdAt: new Date().toISOString()
  }
];

// API Routes
app.get('/api/tickets', (req, res) => {
  res.json({ success: true, tickets });
});

app.post('/api/tickets', (req, res) => {
  const { title, description, priority } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  const newTicket = {
    id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
    title,
    description,
    status: 'open',
    priority: priority || 'medium',
    createdAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  res.status(201).json({ success: true, ticket: newTicket });
});

app.put('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ticketIndex = tickets.findIndex(t => t.id === id);

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const { title, description, status, priority } = req.body;
  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = title;
  if (description !== undefined) allowedUpdates.description = description;
  if (status !== undefined) allowedUpdates.status = status;
  if (priority !== undefined) allowedUpdates.priority = priority;
  
  tickets[ticketIndex] = { ...tickets[ticketIndex], ...allowedUpdates };
  res.json({ success: true, ticket: tickets[ticketIndex] });
});

app.delete('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ticketIndex = tickets.findIndex(t => t.id === id);

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  tickets.splice(ticketIndex, 1);
  res.json({ success: true, message: 'Ticket deleted' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve main portal for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TIKIT System server running on port ${PORT}`);
  console.log(`Main portal: http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/tickets`);
});
