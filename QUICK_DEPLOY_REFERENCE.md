# 🚀 Quick Vercel Deployment Reference

## Exact Configuration for TiKiT System

Copy and paste these settings when deploying to Vercel.

---

=== FRAMEWORK DETECTION ===
Framework: Next.js 16.1.6 (App Router)
App Type: Frontend-only (Supabase handles backend)
Uses Serverless API: No

=== VERCEL CONFIGURATION ===
Application Preset: Next.js
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: .next

=== ENVIRONMENT VARIABLES ===
**Required:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

**Optional (for AI features):**
- OPENAI_API_KEY
- GOOGLE_AI_API_KEY
- ANTHROPIC_API_KEY
- FACEBOOK_APP_ID
- FACEBOOK_APP_SECRET
- INSTAGRAM_REDIRECT_URI
- ENCRYPTION_KEY

=== DEPLOYMENT NOTES ===

**Critical:**
1. ✅ Framework auto-detected as Next.js
2. ✅ Root directory MUST be set to `frontend`
3. ✅ Environment variables MUST include Supabase credentials
4. ⚠️ Build will fail without proper environment variables

**Warnings:**
1. No Node version specified - uses Vercel default (18.x+)
2. React 19 and Next.js 16 are latest versions
3. No API routes - purely frontend with Supabase backend
4. Ensure Supabase project is set up before deployment

**Common Issues:**
- Missing Supabase URL → App won't load
- Wrong root directory → Build fails
- Missing dependencies → Install command fails

**Build Time:** ~2-3 minutes
**Deploy Time:** ~30 seconds
**Total:** ~3-5 minutes

---

## 📋 Deployment Checklist

Before deploying:
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Supabase URL obtained
- [ ] Supabase anon key obtained
- [ ] Repository pushed to GitHub
- [ ] Branch selected (main)

During deployment:
- [ ] Framework preset: Next.js
- [ ] Root directory: frontend
- [ ] Environment variables added
- [ ] Build command: npm run build
- [ ] Output directory: .next

After deployment:
- [ ] Test homepage loads
- [ ] Test login/signup
- [ ] Check browser console
- [ ] Verify Supabase connection
- [ ] Test on mobile

---

## 🔗 Quick Links

- Deploy: https://vercel.com/new
- Docs: See VERCEL_DEPLOYMENT_CONFIG.md for full details
- Support: Check Vercel build logs if issues occur

---

**Status:** ✅ Configuration Verified & Production-Ready
