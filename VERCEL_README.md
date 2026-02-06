# TIKIT - Vercel Deployment Quick Start

Deploy the TIKIT Influencer Marketing Platform to Vercel in under 5 minutes!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cabdelkhalegh/TIKIT-SYSTEM-&project-name=tikit-platform&repository-name=TIKIT-SYSTEM-&root-directory=frontend)

## 🚀 One-Click Deploy

Click the button above to deploy automatically with pre-configured settings.

## 📋 Manual Deployment Steps

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Backend API deployed (or use localhost for testing)

### Step 1: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `cabdelkhalegh/TIKIT-SYSTEM-`
3. Click "Import"

### Step 2: Configure Project Settings

**IMPORTANT**: Set these before deploying:

| Setting | Value | Required |
|---------|-------|----------|
| **Root Directory** | `frontend` | ✅ YES |
| **Framework Preset** | Next.js | ✅ Auto-detected |
| **Build Command** | `npm run build` | ✅ Auto-set |
| **Output Directory** | `.next` | ✅ Auto-set |
| **Install Command** | `npm install` | ✅ Auto-set |

### Step 3: Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables

```bash
# Backend API URLs (replace with your actual backend URL)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app

# App Configuration
NEXT_PUBLIC_APP_NAME=TIKIT
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Variables

```bash
# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Development (optional)
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
```

**💡 Pro Tip**: You can add environment variables later in Project Settings → Environment Variables

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project.vercel.app`

## ✅ Post-Deployment Checklist

After deployment completes:

- [ ] Visit your Vercel URL
- [ ] Check that landing page loads
- [ ] Verify no console errors (F12 Developer Tools)
- [ ] Test login page accessibility
- [ ] Configure custom domain (optional)

### With Backend Connected:
- [ ] Login with test credentials
- [ ] Verify dashboard loads
- [ ] Test core features (clients, campaigns, influencers)
- [ ] Check API responses in Network tab

## 🎯 What Gets Deployed

**Application Features:**
- ✅ 31 Next.js pages (App Router)
- ✅ Authentication system (login/register)
- ✅ Dashboard with analytics charts
- ✅ Client management (CRUD operations)
- ✅ Campaign wizard (4-step creation)
- ✅ Influencer discovery (search, AI matching)
- ✅ Collaboration workflows
- ✅ Real-time notifications
- ✅ Media management
- ✅ Settings and user profile
- ✅ Global search (Cmd/Ctrl+K)

**Technical Stack:**
- Next.js 14 (App Router)
- TypeScript (100% type-safe)
- Tailwind CSS
- React Query
- React Hook Form + Zod
- Recharts for analytics

## ⚙️ Backend Integration

### Deploying the Backend

The frontend requires a backend API. Deploy it first to:

**Recommended Platforms:**
- Railway (easiest)
- Render
- Heroku
- AWS/GCP/Azure

**Backend Repository:** `backend/` folder in this repo

**Once deployed:**
1. Copy your backend URL
2. Update environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` → `https://your-backend.com/api/v1`
   - `NEXT_PUBLIC_API_BASE_URL` → `https://your-backend.com`
3. Redeploy frontend (Deployments → ... → Redeploy)

### Configure Backend CORS

Your backend must allow requests from your Vercel domain:

```javascript
// Backend CORS configuration example
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app.vercel.app',
  'https://your-custom-domain.com'
];
```

## 🔧 Troubleshooting

### Build Fails

**Error: "Root directory not found"**
- ✅ Solution: Set Root Directory to `frontend` in project settings

**Error: "Missing environment variables"**
- ✅ Solution: Add required env vars (see Step 3 above)
- Note: `NEXT_PUBLIC_*` variables are safe for client-side

**Error: "Build exceeded time limit"**
- ✅ Solution: Check for infinite loops or large dependencies
- Consider splitting large components

### Deployment Succeeds But App Doesn't Work

**Blank page or 404 errors**
- Check browser console (F12) for errors
- Verify all pages are in `frontend/src/app/` directory
- Check Next.js App Router structure

**API calls fail (Network errors)**
- ✅ Verify `NEXT_PUBLIC_API_URL` is set correctly
- ✅ Check backend is deployed and running
- ✅ Ensure backend CORS allows your Vercel domain
- ✅ Test backend directly: `curl https://your-backend.com/health`

**Images not loading**
- Check `next.config.js` image domains
- Verify image paths are correct

### Performance Issues

**Slow page loads**
- Enable Vercel Analytics
- Check bundle size in build logs
- Consider code splitting for large pages

## 📱 Custom Domain Setup (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. Wait for DNS propagation (5-30 minutes)
5. Update `NEXT_PUBLIC_APP_URL` environment variable

## 🔄 Continuous Deployment

**Auto-Deploy Enabled:**
- Push to main branch → Automatic deployment
- Pull requests → Preview deployments
- Commits → Automatic rebuilds

**Manual Deploy:**
- Deployments → ... → Redeploy

## 📊 Monitoring

**Vercel Dashboard:**
- View deployments: `vercel.com/your-project`
- Check logs: Deployments → Function Logs
- Analytics: Analytics tab (if enabled)

**Environment Variables:**
- Update: Project Settings → Environment Variables
- After changes: Trigger redeploy

## 🆘 Need Help?

**Documentation:**
- 📚 [Complete Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)
- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [Next.js Deployment](https://nextjs.org/docs/deployment)

**Common Issues:**
- [Troubleshooting Guide](./VERCEL_DEPLOYMENT_GUIDE.md#troubleshooting)
- [Environment Variables Guide](./VERCEL_DEPLOYMENT_GUIDE.md#environment-variables)

## 🎉 Success!

Your TIKIT platform should now be live at: `https://your-project.vercel.app`

**Next Steps:**
1. Test all features thoroughly
2. Connect your custom domain
3. Deploy backend if not done
4. Update environment variables with production URLs
5. Enable Vercel Analytics (optional)
6. Set up monitoring/alerting

---

**Status**: ✅ Production Ready  
**Framework**: Next.js 14  
**Version**: 1.0.0  
**Deploy Time**: ~3 minutes  
**Cost**: Free (Hobby tier)

**Questions?** Open an issue or check the [full deployment guide](./VERCEL_DEPLOYMENT_GUIDE.md).
