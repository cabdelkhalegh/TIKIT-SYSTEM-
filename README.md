# TiKiT Agency Management System 🎬

A comprehensive campaign and influencer management system for TiKiT Agency. Manage the complete lifecycle of campaigns and influencers from A to Z, including payment tracking and delivery monitoring.

## 🎯 Purpose

This system is designed to manage the full end-to-end campaign lifecycle for TiKiT Agency, including:
- **Campaign Management** - Create, track, and manage marketing campaigns
- **Influencer Management** - Maintain influencer database with performance metrics
- **Payment Tracking** - Monitor payment status for each campaign
- **Delivery Tracking** - Track on-time delivery and campaign deadlines
- **Full Lifecycle Management** - From campaign creation to completion

## 🚀 Quick Start

### Option 1: Run with Docker (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at: **http://localhost:3000**

### Option 2: Run with Node.js

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with auto-reload
npm run dev
```

## 📁 Project Structure

```
TIKIT-SYSTEM-/
├── public/              # Frontend files
│   ├── index.html       # Main portal (campaigns & influencers)
│   ├── css/
│   │   └── styles.css   # Application styles
│   └── js/
│       └── app.js       # Frontend JavaScript logic
├── server.js            # Express backend server with APIs
├── package.json         # Node.js dependencies
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose configuration
```

## 🔧 Features

### Campaign Management
- ✅ Create and manage campaigns
- ✅ Track campaign status (Active, Completed, Cancelled, Draft)
- ✅ Assign influencers to campaigns
- ✅ Set campaign budgets and priorities
- ✅ Monitor delivery dates and deadlines
- ✅ Define deliverables (posts, stories, videos, etc.)
- ✅ Track payment status (Pending, Paid, Partial)

### Influencer Management
- ✅ Maintain influencer database
- ✅ Track followers and engagement rates
- ✅ Categorize influencers by niche
- ✅ Store contact information (email, phone)
- ✅ Monitor influencer performance
- ✅ Multi-platform support (Instagram, TikTok, YouTube, etc.)

### Additional Features
- ✅ Responsive web interface
- ✅ RESTful API
- ✅ Real-time data updates
- ✅ Docker deployment ready
- ✅ Payment tracking
- ✅ Delivery timeline monitoring

## 📡 API Endpoints

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create a new campaign
- `PUT /api/campaigns/:id` - Update a campaign
- `DELETE /api/campaigns/:id` - Delete a campaign

### Influencers
- `GET /api/influencers` - Get all influencers
- `POST /api/influencers` - Add a new influencer
- `PUT /api/influencers/:id` - Update an influencer
- `DELETE /api/influencers/:id` - Delete an influencer

### System
- `GET /health` - Health check endpoint

## 🛠️ Build & Deployment

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Deploy with Docker
```bash
# Build the Docker image
docker build -t tikit-system .

# Run the container
docker run -p 3000:3000 tikit-system
```

### Stop the Application
```bash
# If running with Docker Compose
docker-compose down

# If running with Node.js
# Press Ctrl+C in the terminal
```

## 🌐 Access the Application

Once deployed, access the main portal at:
- **Local**: http://localhost:3000
- **Campaigns API**: http://localhost:3000/api/campaigns
- **Influencers API**: http://localhost:3000/api/influencers

### Using the Portal

1. **Campaigns Tab**: Create and manage marketing campaigns
   - Enter campaign name and description
   - Assign influencer and select platform
   - Set budget and delivery date
   - Define deliverables
   - Track payment and campaign status

2. **Influencers Tab**: Manage your influencer database
   - Add influencer details
   - Track followers and engagement metrics
   - Store contact information
   - Categorize by niche/industry
   - Monitor performance across platforms

## 📝 Requirements

- Node.js 18+ (if running without Docker)
- Docker & Docker Compose (for containerized deployment)

## 🐛 Troubleshooting

If the application fails to start:
1. Ensure port 3000 is not in use
2. Check that all files are in the correct folders
3. Run `npm install` to ensure dependencies are installed
4. Check Docker logs: `docker-compose logs`

## 📄 License

ISC
