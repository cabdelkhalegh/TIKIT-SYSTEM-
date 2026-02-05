require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const serverPort = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'tikit-backend-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    application: 'TIKIT System Backend',
    version: '0.1.0',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

app.listen(serverPort, '0.0.0.0', () => {
  console.log(`TIKIT Backend API listening on port ${serverPort}`);
});
