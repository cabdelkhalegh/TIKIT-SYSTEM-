const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl) or in non-production environments
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for campaigns
let campaignIdCounter = 1;
let campaigns = [
  {
    id: campaignIdCounter++,
    campaignName: 'Summer Product Launch',
    description: 'Launch campaign for new summer collection',
    influencerName: 'Jane Doe',
    influencerPlatform: 'Instagram',
    budget: 5000,
    paymentStatus: 'pending',
    deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'active',
    priority: 'high',
    deliverables: '3 posts, 5 stories',
    createdAt: new Date().toISOString()
  }
];

// In-memory storage for influencers
let influencerIdCounter = 1;
let influencers = [
  {
    id: influencerIdCounter++,
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

  // Validate budget
  let parsedBudget = 0;
  if (budget !== undefined && budget !== null && budget !== '') {
    parsedBudget = Number(budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 1000000000) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a non-negative number and less than or equal to 1,000,000,000'
      });
    }
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  const campaignPriority = priority || 'medium';
  if (!validPriorities.includes(campaignPriority)) {
    return res.status(400).json({
      success: false,
      message: 'Priority must be one of: low, medium, high'
    });
  }

  const newCampaign = {
    id: campaignIdCounter++,
    campaignName,
    description,
    influencerName: influencerName || '',
    influencerPlatform: influencerPlatform || '',
    budget: parsedBudget,
    paymentStatus: 'pending',
    deliveryDate: deliveryDate || '',
    status: 'active',
    priority: campaignPriority,
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
  
  // Validate budget
  if (budget !== undefined) {
    const parsedBudget = Number(budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0 || parsedBudget > 1000000000) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a non-negative number and less than or equal to 1,000,000,000'
      });
    }
    allowedUpdates.budget = parsedBudget;
  }
  
  // Validate paymentStatus
  if (paymentStatus !== undefined) {
    const validPaymentStatuses = ['pending', 'paid', 'partial'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Payment status must be one of: pending, paid, partial'
      });
    }
    allowedUpdates.paymentStatus = paymentStatus;
  }
  
  if (deliveryDate !== undefined) allowedUpdates.deliveryDate = deliveryDate;
  
  // Validate status
  if (status !== undefined) {
    const validStatuses = ['active', 'completed', 'cancelled', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: active, completed, cancelled, draft'
      });
    }
    allowedUpdates.status = status;
  }
  
  // Validate priority
  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: low, medium, high'
      });
    }
    allowedUpdates.priority = priority;
  }
  
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

  // Validate followers
  let parsedFollowers = 0;
  if (followers !== undefined && followers !== null && followers !== '') {
    parsedFollowers = Number(followers);
    if (!Number.isFinite(parsedFollowers) || parsedFollowers < 0 || parsedFollowers > 1000000000) {
      return res.status(400).json({
        success: false,
        message: 'Followers must be a non-negative number and less than or equal to 1,000,000,000'
      });
    }
  }

  // Validate engagement rate
  let parsedEngagementRate = 0;
  if (engagementRate !== undefined && engagementRate !== null && engagementRate !== '') {
    parsedEngagementRate = Number(engagementRate);
    if (!Number.isFinite(parsedEngagementRate) || parsedEngagementRate < 0 || parsedEngagementRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Engagement rate must be between 0 and 100'
      });
    }
  }

  const newInfluencer = {
    id: influencerIdCounter++,
    name,
    platform,
    followers: parsedFollowers,
    engagementRate: parsedEngagementRate,
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
  
  // Validate followers
  if (followers !== undefined) {
    const parsedFollowers = Number(followers);
    if (!Number.isFinite(parsedFollowers) || parsedFollowers < 0 || parsedFollowers > 1000000000) {
      return res.status(400).json({
        success: false,
        message: 'Followers must be a non-negative number and less than or equal to 1,000,000,000'
      });
    }
    allowedUpdates.followers = parsedFollowers;
  }
  
  // Validate engagement rate
  if (engagementRate !== undefined) {
    const parsedEngagementRate = Number(engagementRate);
    if (!Number.isFinite(parsedEngagementRate) || parsedEngagementRate < 0 || parsedEngagementRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Engagement rate must be between 0 and 100'
      });
    }
    allowedUpdates.engagementRate = parsedEngagementRate;
  }
  
  if (category !== undefined) allowedUpdates.category = category;
  if (email !== undefined) allowedUpdates.email = email;
  if (phone !== undefined) allowedUpdates.phone = phone;
  
  // Validate status
  if (status !== undefined) {
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: active, inactive'
      });
    }
    allowedUpdates.status = status;
  }
  
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
