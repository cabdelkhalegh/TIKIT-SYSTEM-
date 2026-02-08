# 🎯 DEPLOYMENT - Final Instructions

## Quick Start (Copy & Paste These Commands)

### On Your Local Machine or Production Server:

```bash
# Step 1: Clone Repository
git clone https://github.com/cabdelkhalegh/TIKIT-SYSTEM-.git
cd TIKIT-SYSTEM-

# Step 2: Checkout Main Branch
git checkout main
git pull origin main

# Step 3: Verify Prerequisites
docker --version          # Should show Docker 20.x or higher
docker compose version    # Should show Docker Compose v2.x

# Step 4: Build Containers (Takes 5-10 minutes)
docker compose build

# Step 5: Start All Services
docker compose up -d

# Step 6: Wait for Services to Initialize (30 seconds)
sleep 30

# Step 7: Verify Deployment
./verify-deployment.sh

# Step 8: Check Service Status
docker compose ps

# Step 9: View Logs
docker compose logs -f
# Press Ctrl+C to exit logs
```

---

## Access the Application

### URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/health
- **Database**: PostgreSQL on localhost:5432

### Login Credentials
```
Email: admin@tikit.com
Password: Admin123!
```

---

## Testing Checklist

### ✅ Essential Tests (5 minutes)

1. **Open Browser**
   - Go to: http://localhost:3000
   - ✅ Landing page loads

2. **Login**
   - Click "Sign In"
   - Email: admin@tikit.com
   - Password: Admin123!
   - ✅ Dashboard loads

3. **Dashboard**
   - ✅ See 4 stat cards
   - ✅ Charts display
   - ✅ Recent activity shows

4. **Create Client**
   - Click "Clients" in sidebar
   - Click "+ New Client"
   - Fill in form and submit
   - ✅ Client created successfully

5. **Global Search**
   - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
   - Type something
   - ✅ Search results appear

**If all 5 tests pass**: ✅ **DEPLOYMENT SUCCESSFUL**

---

## Complete Testing

For comprehensive testing, follow:
- **POST_DEPLOYMENT_TESTING.md** - 15 detailed test scenarios
- **UI_TESTING_GUIDE.md** - Complete feature walkthrough

---

## Troubleshooting

### Services Won't Start
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose logs
```

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # Database

# Kill the process or change ports in .env
```

### Frontend Shows Blank Page
```bash
docker compose logs frontend
docker compose restart frontend
```

### Can't Login
```bash
# Check backend logs
docker compose logs backend

# Verify database is healthy
docker compose exec db pg_isready -U tikit_user
```

---

## Management Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart frontend
```

### Stop Services
```bash
# Stop (keeps data)
docker compose down

# Stop and remove data
docker compose down -v
```

### Rebuild
```bash
# Rebuild specific service
docker compose build frontend
docker compose build backend

# Rebuild all
docker compose build
```

---

## Expected Results

### After `docker compose up -d`:

```
[+] Running 3/3
 ✔ Container tikit-db        Started
 ✔ Container tikit-backend   Started  
 ✔ Container tikit-frontend  Started
```

### After `docker compose ps`:

```
NAME              STATUS    PORTS
tikit-db          Up        0.0.0.0:5432->5432/tcp
tikit-backend     Up        0.0.0.0:3001->3001/tcp
tikit-frontend    Up        0.0.0.0:3000->3000/tcp
```

### After `curl http://localhost:3001/health`:

```json
{"status":"ok","timestamp":"2026-02-06T..."}
```

### After opening http://localhost:3000:

```
TIKIT landing page with "Sign In" button
```

---

## Screenshots to Take

For documentation, capture:

1. **Terminal after `docker compose ps`** - Shows all services running
2. **Landing page** - http://localhost:3000
3. **Dashboard after login** - Shows analytics
4. **Client list page** - Shows clients table
5. **Campaign detail page** - Shows campaign info
6. **Global search** - Shows search modal

---

## Success Indicators

✅ **All Good If:**
- All 3 containers show "Up" status
- Frontend loads at http://localhost:3000
- Backend returns JSON at http://localhost:3001/health
- Can login with admin credentials
- Dashboard displays without errors
- Can navigate between pages

❌ **Issues If:**
- Containers keep restarting
- Frontend shows blank page or errors
- Backend health endpoint doesn't respond
- Login fails with credentials
- Console shows errors (F12 → Console)

---

## Security Note

⚠️ **Before Production Use:**
Change these values in `.env`:
```bash
JWT_SECRET=your-super-secret-random-key-here
POSTGRES_PASSWORD=your-secure-database-password
```

Generate a secure JWT_SECRET:
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Production Deployment Extras

### Enable HTTPS
- Use nginx or Traefik as reverse proxy
- Configure SSL certificates (Let's Encrypt)
- Update NEXT_PUBLIC_API_URL to use https://

### Database Backup
```bash
# Backup
docker compose exec db pg_dump -U tikit_user tikitdb > backup.sql

# Restore
docker compose exec -T db psql -U tikit_user tikitdb < backup.sql
```

### Monitoring
- Add Datadog or New Relic for APM
- Add Sentry for error tracking
- Set up uptime monitoring

### Scaling
- Use Docker Swarm or Kubernetes for multi-server
- Add load balancer for frontend
- Use managed PostgreSQL (AWS RDS, etc.)

---

## Support

### Documentation
- `DEPLOYMENT_STATUS.md` - Full deployment report
- `POST_DEPLOYMENT_TESTING.md` - Testing checklist
- `QUICK_START_DEPLOYMENT.md` - Detailed guide
- `UI_TESTING_GUIDE.md` - Feature testing

### Quick Help
```bash
# Service status
docker compose ps

# Service logs
docker compose logs [service-name]

# Restart everything
docker compose restart

# Start fresh
docker compose down -v && docker compose up -d
```

---

## Timeline

**Expected Duration:**
- Build: 5-10 minutes
- Start: 1-2 minutes
- Verify: 2-3 minutes
- Essential tests: 5 minutes

**Total: ~15-20 minutes for complete deployment and basic verification**

---

## Final Checklist

Before considering deployment complete:

- [ ] All containers running (`docker compose ps`)
- [ ] No errors in logs (`docker compose logs`)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Backend healthy (http://localhost:3001/health)
- [ ] Can login with admin@tikit.com
- [ ] Dashboard displays data
- [ ] Can create a client
- [ ] Can create a campaign
- [ ] Global search works
- [ ] No console errors in browser

---

**Once all checkboxes are ticked**: ✅ **DEPLOYMENT COMPLETE!**

---

*Last Updated: February 6, 2026*  
*Version: 1.0.0*  
*Status: READY FOR DEPLOYMENT*
