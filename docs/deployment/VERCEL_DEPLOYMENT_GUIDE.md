# TIKIT Frontend - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the TIKIT frontend to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with repository access
- Backend API deployed and accessible (required for full functionality)

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository: `cabdelkhalegh/TIKIT-SYSTEM-`
   - Click "Import"

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Set Environment Variables**
   Click "Environment Variables" and add the following:

   **Required Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
   NEXT_PUBLIC_APP_NAME=TIKIT
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   ```

   **Optional Variables:**
   ```
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Repository Root**
   ```bash
   cd /path/to/TIKIT-SYSTEM-
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (or **Y** if you have one)
   - What's your project's name? **tikit-frontend**
   - In which directory is your code located? **frontend**

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter the value when prompted: https://your-backend-api.com/api/v1
   
   vercel env add NEXT_PUBLIC_API_BASE_URL production
   # Enter the value when prompted: https://your-backend-api.com
   
   vercel env add NEXT_PUBLIC_APP_NAME production
   # Enter the value: TIKIT
   
   vercel env add NEXT_PUBLIC_APP_URL production
   # Enter the value: https://your-vercel-app.vercel.app
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables Reference

### Production Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api/v1 path | `https://api.tikit.com/api/v1` | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `https://api.tikit.com` | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | `TIKIT` | Yes |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `https://tikit.vercel.app` | Yes |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics features | `true` or `false` | No |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | Enable notifications | `true` | No |

### Backend API Requirements

Your backend API must be deployed and accessible at the URL you specify in `NEXT_PUBLIC_API_URL`.

**Backend Endpoints Expected:**
- Authentication: `/api/v1/auth/login`, `/api/v1/auth/register`
- Clients: `/api/v1/clients`
- Campaigns: `/api/v1/campaigns`
- Influencers: `/api/v1/influencers`
- Collaborations: `/api/v1/collaborations`
- Notifications: `/api/v1/notifications`
- Media: `/api/v1/media`

**CORS Configuration:**
Your backend must allow requests from your Vercel domain:
```javascript
// Example Express.js CORS config
const cors = require('cors');
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

## Vercel Project Settings

### Build & Development Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### Node.js Version

Vercel will automatically use Node.js 18.x or later. To specify a version, add to `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Deployment Checklist

Before deploying, ensure:

- [ ] Backend API is deployed and accessible
- [ ] Backend CORS configured to allow Vercel domain
- [ ] All environment variables are set in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Database is accessible from backend

## Post-Deployment Verification

After deployment, verify:

1. **Frontend Loads**
   - Visit your Vercel URL
   - Check that the landing page loads
   - Verify no console errors

2. **Authentication Works**
   - Try to log in with test credentials
   - Verify API calls succeed
   - Check that token is stored

3. **Core Features Work**
   - Dashboard displays data
   - Can create/edit clients
   - Can create/edit campaigns
   - Can browse influencers

4. **Performance**
   - Check Lighthouse score (target: >90)
   - Verify fast page loads
   - Test on mobile devices

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Build exceeded maximum duration"**
- Solution: Optimize build size or upgrade Vercel plan
- Check for large dependencies

### Runtime Errors

**Error: "CORS policy blocking requests"**
- Solution: Configure backend CORS to allow Vercel domain
- Add your Vercel URL to backend allowed origins

**Error: "Failed to fetch" or "Network error"**
- Solution: Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is accessible and running

**Error: "Unauthorized" on all API calls**
- Solution: Check authentication flow
- Verify JWT tokens are being sent correctly

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Rebuild and redeploy after adding variables
- Check Vercel dashboard that variables are set correctly

## Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `tikit.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch or open a PR

To disable automatic deployments:
1. Go to Settings → Git
2. Uncheck "Automatic Deployments"

## Monitoring & Analytics

### Vercel Analytics

Enable Vercel Analytics for free:
1. Go to Analytics tab in Vercel Dashboard
2. Click "Enable"
3. View real-time traffic and performance metrics

### Error Monitoring

View runtime errors:
1. Go to Deployments → Select deployment
2. Click "Functions" tab
3. View function logs and errors

## Performance Optimization

### Recommended Settings

1. **Enable Edge Functions** (for faster API routes)
   - Go to Settings → Functions
   - Enable Edge Runtime where applicable

2. **Enable Compression**
   - Automatic with Vercel

3. **Image Optimization**
   - Use Next.js `<Image>` component (already configured)
   - Vercel automatically optimizes images

4. **Caching**
   - Static pages are automatically cached
   - Configure `Cache-Control` headers as needed

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **TIKIT Documentation**: See repository README.md

## Deployment Status

Current deployment status for TIKIT:

- **Frontend**: Ready for Vercel deployment ✅
- **Backend**: Needs to be deployed separately (Railway, Heroku, AWS, etc.)
- **Database**: PostgreSQL required for backend

## Example Production URLs

After deployment, you'll have:
- **Frontend**: `https://tikit-frontend.vercel.app`
- **Backend**: `https://your-backend.herokuapp.com` (example)
- **API**: `https://your-backend.herokuapp.com/api/v1`

Update environment variables accordingly.

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Set environment variable
vercel env add [variable-name] production

# Pull environment variables locally
vercel env pull
```

---

**Last Updated**: February 2026  
**Status**: Ready for deployment  
**Version**: 1.0.0
