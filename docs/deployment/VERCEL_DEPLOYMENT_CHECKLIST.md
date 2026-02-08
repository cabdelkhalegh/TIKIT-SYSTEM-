# Vercel Deployment Checklist

Use this checklist to ensure a successful Vercel deployment for the TIKIT platform.

## ✅ Pre-Deployment Checklist

### Repository Setup
- [ ] Repository is on GitHub
- [ ] You have admin access to the repository
- [ ] Code is on the branch you want to deploy (usually `main`)
- [ ] All changes are committed and pushed

### Backend Preparation
- [ ] Backend is deployed to a hosting platform
- [ ] Backend health endpoint is accessible (`/health` or similar)
- [ ] Backend database is configured and connected
- [ ] Backend CORS is configured (see below)
- [ ] Test API endpoint URLs are working

### Vercel Account
- [ ] Vercel account created (free tier is fine)
- [ ] GitHub account connected to Vercel
- [ ] Repository access granted to Vercel

## 📋 Deployment Steps Checklist

### Step 1: Import Project
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Click "Import Git Repository"
- [ ] Select `cabdelkhalegh/TIKIT-SYSTEM-` repository
- [ ] Click "Import"

### Step 2: Configure Settings
- [ ] Set **Root Directory** to `frontend`
- [ ] Verify **Framework Preset** is `Next.js`
- [ ] Verify **Build Command** is `npm run build`
- [ ] Verify **Output Directory** is `.next`
- [ ] Verify **Install Command** is `npm install`

### Step 3: Environment Variables

#### Required Variables ⚠️
- [ ] `NEXT_PUBLIC_API_URL` - Set to your backend API endpoint
  - Example: `https://your-backend.railway.app/api/v1`
  - Must end with `/api/v1`
  
- [ ] `NEXT_PUBLIC_API_BASE_URL` - Set to your backend base URL
  - Example: `https://your-backend.railway.app`
  - No trailing slash
  
- [ ] `NEXT_PUBLIC_APP_NAME` - Set to `TIKIT`
  
- [ ] `NEXT_PUBLIC_APP_URL` - Will be your Vercel URL
  - Example: `https://tikit-platform.vercel.app`
  - Can be updated after first deployment

#### Optional Variables
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS` - Set to `true` or `false`
- [ ] `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` - Set to `true` or `false`
- [ ] `NEXT_PUBLIC_ENABLE_DEVTOOLS` - Set to `false` for production

### Step 4: Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check build logs for any errors
- [ ] Note your deployment URL

## ✅ Post-Deployment Verification

### Basic Checks
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] No 404 errors in browser console (F12)
- [ ] Landing page displays correctly
- [ ] Navigation menu works
- [ ] Login page is accessible

### API Integration Checks (Requires Backend)
- [ ] Login form submits without CORS errors
- [ ] Can successfully login with test credentials
- [ ] Dashboard loads after login
- [ ] API calls appear in Network tab (F12)
- [ ] API responses are successful (200/201 status)
- [ ] No authentication errors

### Feature Testing
- [ ] Dashboard analytics load
- [ ] Can navigate to Clients page
- [ ] Can navigate to Campaigns page
- [ ] Can navigate to Influencers page
- [ ] Global search works (Cmd/Ctrl+K)
- [ ] Notifications center accessible
- [ ] Settings page loads
- [ ] User profile loads

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Images load correctly
- [ ] No layout shift (CLS)
- [ ] Smooth navigation between pages

## 🔧 Backend CORS Configuration

Your backend must allow requests from your Vercel domain:

```javascript
// Example backend CORS configuration
const allowedOrigins = [
  'http://localhost:3000',           // Local development
  'https://tikit-platform.vercel.app', // Your Vercel URL
  'https://your-custom-domain.com'   // If you have one
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

- [ ] CORS configured in backend
- [ ] Vercel URL added to allowed origins
- [ ] Backend redeployed with CORS changes
- [ ] CORS tested from Vercel deployment

## 🔄 Continuous Deployment Setup

### Automatic Deployments
- [ ] Automatic deployments enabled (default)
- [ ] Production branch set to `main`
- [ ] Preview deployments enabled for PRs

### Deployment Protection (Optional)
- [ ] Deployment protection configured
- [ ] Protected branches set
- [ ] Deploy hooks configured (if needed)

## 🌐 Custom Domain Setup (Optional)

If you want a custom domain:

- [ ] Domain purchased and available
- [ ] Go to Project Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter your domain
- [ ] Follow DNS configuration instructions
- [ ] Add DNS records to your domain registrar
- [ ] Wait for DNS propagation (5 minutes - 48 hours)
- [ ] Update `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Redeploy to apply changes

## 📊 Monitoring Setup (Optional)

### Vercel Analytics
- [ ] Go to Analytics tab
- [ ] Click "Enable Analytics"
- [ ] Set up data retention preferences

### Error Tracking
- [ ] Set up error tracking service (Sentry, etc.)
- [ ] Add error tracking SDK to frontend
- [ ] Configure error reporting
- [ ] Test error tracking

## 🚨 Troubleshooting Checklist

If deployment fails, check:

### Build Errors
- [ ] All dependencies in package.json
- [ ] No TypeScript errors
- [ ] Environment variables are set
- [ ] Root directory is `frontend`
- [ ] Build command is correct

### Runtime Errors
- [ ] API URL environment variables are correct
- [ ] Backend is running and accessible
- [ ] CORS is configured on backend
- [ ] No console errors in browser
- [ ] Network tab shows successful API calls

### Common Issues
- [ ] Clear browser cache and cookies
- [ ] Try incognito/private mode
- [ ] Test on different browser
- [ ] Check Vercel function logs
- [ ] Review deployment logs

## 📝 Documentation Updates

After successful deployment:

- [ ] Update README.md with production URL
- [ ] Document environment variables used
- [ ] Update API documentation if needed
- [ ] Create user guide if needed
- [ ] Document any custom configurations

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ App loads at Vercel URL
- ✅ All pages are accessible
- ✅ API calls work correctly
- ✅ Authentication works
- ✅ Core features are functional
- ✅ No console errors
- ✅ Performance is acceptable

## 🔐 Security Checklist

- [ ] Environment variables not exposed in client code
- [ ] API keys stored securely (not in code)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Security headers configured
- [ ] XSS protection enabled
- [ ] CSRF protection in place

## 📞 Support Resources

If you need help:

- 📚 [VERCEL_README.md](./VERCEL_README.md) - Quick start guide
- 📖 [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Complete guide
- 🌐 [Vercel Documentation](https://vercel.com/docs)
- 🌐 [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

## ✅ Final Sign-Off

Once all checks pass:

- [ ] Deployment is live and stable
- [ ] All stakeholders notified
- [ ] Production URL documented
- [ ] Monitoring is active
- [ ] Support team briefed
- [ ] Rollback plan documented

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Production URL**: _____________  
**Backend URL**: _____________  
**Status**: ✅ Live / ⏳ In Progress / ❌ Failed

---

*This checklist ensures a thorough and successful Vercel deployment for the TIKIT platform.*
