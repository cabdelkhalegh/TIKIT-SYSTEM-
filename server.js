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

// In-memory storage for campaigns
let campaigns = [
  {
    id: 1,
    campaignName: 'Summer Product Launch',
    description: 'Launch campaign for new summer collection',
    influencerName: 'Jane Doe',
    influencerPlatform: 'Instagram',
    budget: 5000,
    paymentStatus: 'pending',
    deliveryDate: '2026-03-15',
    status: 'active',
    priority: 'high',
    deliverables: '3 posts, 5 stories',
    createdAt: new Date().toISOString()
  }
];

// In-memory storage for influencers
let influencers = [
  {
    id: 1,
    name: 'Jane Doe',
    platform: 'Instagram',
    followers: 150000,
    engagementRate: 4.5,
    category: 'Fashion',
    email: 'jane@example.com',
    phone: '+1234567890',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// Campaign API Routes
app.get('/api/campaigns', (req, res) => {
  res.json({ success: true, campaigns });
});

app.post('/api/campaigns', (req, res) => {
  const { campaignName, description, influencerName, influencerPlatform, budget, deliveryDate, deliverables, priority } = req.body;
  
  if (!campaignName || !description) {
    return res.status(400).json({ success: false, message: 'Campaign name and description are required' });
  }

  const newCampaign = {
    id: campaigns.length > 0 ? Math.max(...campaigns.map(c => c.id)) + 1 : 1,
    campaignName,
    description,
    influencerName: influencerName || '',
    influencerPlatform: influencerPlatform || '',
    budget: budget || 0,
    paymentStatus: 'pending',
    deliveryDate: deliveryDate || '',
    status: 'active',
    priority: priority || 'medium',
    deliverables: deliverables || '',
    createdAt: new Date().toISOString()
  };

  campaigns.push(newCampaign);
  res.status(201).json({ success: true, campaign: newCampaign });
});

app.put('/api/campaigns/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const campaignIndex = campaigns.findIndex(c => c.id === id);

  if (campaignIndex === -1) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  const { campaignName, description, influencerName, influencerPlatform, budget, paymentStatus, deliveryDate, status, priority, deliverables } = req.body;
  const allowedUpdates = {};
  if (campaignName !== undefined) allowedUpdates.campaignName = campaignName;
  if (description !== undefined) allowedUpdates.description = description;
  if (influencerName !== undefined) allowedUpdates.influencerName = influencerName;
  if (influencerPlatform !== undefined) allowedUpdates.influencerPlatform = influencerPlatform;
  if (budget !== undefined) allowedUpdates.budget = budget;
  if (paymentStatus !== undefined) allowedUpdates.paymentStatus = paymentStatus;
  if (deliveryDate !== undefined) allowedUpdates.deliveryDate = deliveryDate;
  if (status !== undefined) allowedUpdates.status = status;
  if (priority !== undefined) allowedUpdates.priority = priority;
  if (deliverables !== undefined) allowedUpdates.deliverables = deliverables;
  
  campaigns[campaignIndex] = { ...campaigns[campaignIndex], ...allowedUpdates };
  res.json({ success: true, campaign: campaigns[campaignIndex] });
});

app.delete('/api/campaigns/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const campaignIndex = campaigns.findIndex(c => c.id === id);

  if (campaignIndex === -1) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  campaigns.splice(campaignIndex, 1);
  res.json({ success: true, message: 'Campaign deleted' });
});

// Influencer API Routes
app.get('/api/influencers', (req, res) => {
  res.json({ success: true, influencers });
});

app.post('/api/influencers', (req, res) => {
  const { name, platform, followers, engagementRate, category, email, phone } = req.body;
  
  if (!name || !platform) {
    return res.status(400).json({ success: false, message: 'Name and platform are required' });
  }

  const newInfluencer = {
    id: influencers.length > 0 ? Math.max(...influencers.map(i => i.id)) + 1 : 1,
    name,
    platform,
    followers: followers || 0,
    engagementRate: engagementRate || 0,
    category: category || '',
    email: email || '',
    phone: phone || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  influencers.push(newInfluencer);
  res.status(201).json({ success: true, influencer: newInfluencer });
});

app.put('/api/influencers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const influencerIndex = influencers.findIndex(i => i.id === id);

  if (influencerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Influencer not found' });
  }

  const { name, platform, followers, engagementRate, category, email, phone, status } = req.body;
  const allowedUpdates = {};
  if (name !== undefined) allowedUpdates.name = name;
  if (platform !== undefined) allowedUpdates.platform = platform;
  if (followers !== undefined) allowedUpdates.followers = followers;
  if (engagementRate !== undefined) allowedUpdates.engagementRate = engagementRate;
  if (category !== undefined) allowedUpdates.category = category;
  if (email !== undefined) allowedUpdates.email = email;
  if (phone !== undefined) allowedUpdates.phone = phone;
  if (status !== undefined) allowedUpdates.status = status;
  
  influencers[influencerIndex] = { ...influencers[influencerIndex], ...allowedUpdates };
  res.json({ success: true, influencer: influencers[influencerIndex] });
});

app.delete('/api/influencers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const influencerIndex = influencers.findIndex(i => i.id === id);

  if (influencerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Influencer not found' });
  }

  influencers.splice(influencerIndex, 1);
  res.json({ success: true, message: 'Influencer deleted' });
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
  console.log(`TiKiT Agency Management System running on port ${PORT}`);
  console.log(`Main portal: http://localhost:${PORT}`);
  console.log(`Campaigns API: http://localhost:${PORT}/api/campaigns`);
  console.log(`Influencers API: http://localhost:${PORT}/api/influencers`);
});
