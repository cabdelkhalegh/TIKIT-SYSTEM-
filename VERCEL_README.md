# TIKIT - Vercel Deployment Quick Start

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cabdelkhalegh/TIKIT-SYSTEM-)

## Quick Deploy to Vercel

### Step 1: Import Project
1. Click the "Deploy with Vercel" button above or go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `cabdelkhalegh/TIKIT-SYSTEM-`

### Step 2: Configure Settings
- **Root Directory**: `frontend`
- **Framework**: Next.js (auto-detected)

### Step 3: Set Environment Variables

Add these environment variables in the Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
NEXT_PUBLIC_APP_NAME=TIKIT
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 4: Deploy
Click "Deploy" and wait ~2-3 minutes for the build to complete.

## Important Notes

⚠️ **Backend Required**: This frontend requires a backend API. You must deploy the backend separately and update the environment variables with the backend URL.

📚 **Full Guide**: See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for complete instructions.

## What Gets Deployed

- ✅ 31 Next.js pages
- ✅ Full authentication flow
- ✅ Dashboard and analytics
- ✅ Client management
- ✅ Campaign management
- ✅ Influencer discovery
- ✅ Collaboration workflows
- ✅ Notifications and media

## After Deployment

1. Visit your Vercel URL (e.g., `https://tikit-xyz.vercel.app`)
2. Login with test credentials (if backend has seed data)
3. Verify all features work

## Troubleshooting

**Build fails?**
- Check that all environment variables are set
- Ensure root directory is set to `frontend`

**API calls fail?**
- Verify backend URL is correct
- Ensure backend CORS allows your Vercel domain
- Check backend is running and accessible

**Need help?** See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**Status**: ✅ Ready for deployment  
**Build Status**: ✅ Passing  
**Framework**: Next.js 14  
**Version**: 1.0.0
