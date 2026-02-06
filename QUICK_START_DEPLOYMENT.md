# 🚀 TIKIT Platform - Quick Deployment Guide

## Pre-Deployment Checklist ✅

All code is ready and committed. Follow these steps to deploy:

## 1. Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 3001, and 5432 available
- At least 2GB RAM available

## 2. Quick Start Deployment

### Step 1: Clone and Setup (if not already done)
```bash
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-
```

### Step 2: Environment Setup
Environment files are already created with defaults. To customize:

```bash
# Edit root .env for Docker Compose variables
nano .env

# Edit backend .env for additional backend config
nano backend/.env

# Edit frontend .env.local for frontend-specific config
nano frontend/.env.local
```

**Important**: Change the `JWT_SECRET` in `.env` for production!

### Step 3: Build and Start Services
```bash
# Build all containers (first time or after code changes)
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs to monitor startup
docker-compose logs -f
```

### Step 4: Verify Deployment
```bash
# Check all services are running
docker-compose ps

# Should show:
# tikit-db         - healthy
# tikit-backend    - running
# tikit-frontend   - running
```

## 3. Access the Application

### 🌐 URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### 👤 Default Test Credentials

**Admin User:**
- Email: admin@tikit.com
- Password: Admin123!
- Role: admin

**Client Manager:**
- Email: manager@tikit.com
- Password: Manager123!
- Role: client_manager

**Influencer Manager:**
- Email: influencer@tikit.com
- Password: Influencer123!
- Role: influencer_manager

> **Note**: These accounts are created during database seeding. If they don't exist, run:
> ```bash
> docker-compose exec backend npx prisma db seed
> ```

## 4. UI Testing Guide

### 4.1 Login Flow
1. Navigate to http://localhost:3000
2. Click "Sign In" 
3. Enter credentials from above
4. You'll be redirected to the dashboard

### 4.2 Dashboard Overview
- View analytics cards (clients, campaigns, influencers, collaborations)
- Check recent activity
- Verify charts are loading

### 4.3 Client Management
1. Click "Clients" in sidebar
2. Click "+ New Client" to create a client
3. Fill in: Company Name, Brand Name, Industry, Contact Email
4. Save and verify it appears in the list
5. Click on a client to view details
6. Edit or delete as needed

### 4.4 Campaign Management
1. Click "Campaigns" in sidebar
2. Click "+ New Campaign"
3. Complete the 4-step wizard:
   - **Step 1**: Basic Info (title, description, client)
   - **Step 2**: Strategy (goals, KPIs, target audience)
   - **Step 3**: Budget & Timeline (budget, dates)
   - **Step 4**: Review and submit
4. View campaign details with tabs:
   - Overview
   - Influencers
   - Budget tracking
   - Analytics

### 4.5 Influencer Discovery
1. Click "Influencers" in sidebar
2. Browse influencer cards
3. Click "+ New Influencer" to add one
4. Try "Advanced Search" for filtering
5. Use "Compare Influencers" to compare up to 4
6. Test "AI Match" for campaign recommendations

### 4.6 Collaboration Workflow
1. Click "Collaborations" in sidebar
2. Create a new collaboration
3. Assign to campaign and influencer
4. Manage deliverables
5. Track payment status
6. Add notes

### 4.7 Global Search
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Type to search across all entities
3. Use arrow keys to navigate results
4. Press Enter to open

### 4.8 Settings & Profile
1. Click "Settings" in sidebar
2. Navigate to "Profile" to update your info
3. Check "Notifications" to configure preferences

### 4.9 Notifications
1. Click the bell icon in the header
2. View recent notifications
3. Mark as read
4. Navigate to notification settings

## 5. Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services
```bash
# Stop all (keeps data)
docker-compose down

# Stop and remove volumes (DELETES DATA)
docker-compose down -v
```

### Database Management
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Access PostgreSQL
docker-compose exec db psql -U tikit_user -d tikitdb
```

## 6. Troubleshooting

### Frontend not loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Backend errors
```bash
# Check backend logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend npx prisma db pull
```

### Database issues
```bash
# Check database health
docker-compose exec db pg_isready -U tikit_user

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port conflicts
If ports 3000, 3001, or 5432 are in use:
```bash
# Edit .env and change:
FRONTEND_PORT=3010
BACKEND_PORT=3011
POSTGRES_PORT=5433

# Restart services
docker-compose down
docker-compose up -d
```

## 7. Production Considerations

### Security
- [ ] Change `JWT_SECRET` in `.env`
- [ ] Change database password in `.env`
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up backup strategy

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging aggregation
- [ ] Set up uptime monitoring
- [ ] Monitor resource usage

### Performance
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Monitor database performance
- [ ] Scale services as needed

## 8. Success Verification

✅ All services running: `docker-compose ps`  
✅ Frontend accessible: http://localhost:3000  
✅ Backend API healthy: http://localhost:3001/health  
✅ Can login with test credentials  
✅ Can create and view clients  
✅ Can create campaigns  
✅ Can browse influencers  
✅ Can manage collaborations  
✅ Global search works (Cmd/Ctrl+K)  

## 9. Next Steps

1. **User Acceptance Testing**: Test all features systematically
2. **Data Migration**: Import real client/campaign data if available
3. **User Training**: Train team members on the platform
4. **Go Live**: Open to real users

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation in `/docs`
- Check `DEPLOYMENT_READY.md` for detailed info

---

**Deployment Status**: ✅ Ready  
**Version**: 1.0.0  
**Last Updated**: February 2026
