# Vercel Build Error Fix Documentation

## The Error

During Vercel deployment, the build was failing with:

```
`destination` does not start with `/`, `http://`, or `https://` for route 
{"source":"/api/:path*","destination":"undefined/:path*"}

Error: Invalid rewrite found
```

## Root Cause

### The Problem

In `frontend/next.config.js`, the rewrites configuration was:

```javascript
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/:path*`,
    },
  ]
},
```

**Why it failed:**
1. `process.env.NEXT_PUBLIC_API_URL` was **undefined** during build
2. The fallback `|| 'http://localhost:3001'` didn't work as expected
3. The destination became `"undefined/:path*"` (invalid URL format)
4. Next.js validation rejected this as an invalid rewrite

### Why Environment Variables Were Undefined

In `vercel.json`, environment variables were only in the `env` section:

```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": {
      "value": "https://api.tikit-demo.com/api/v1"
    }
  }
}
```

**Key Issue:** Variables in `env` are only available at **runtime**, not during **build time**.

Next.js rewrites are evaluated during `next build`, so they need variables in `build.env`.

## The Solution

### Fix 1: Robust Fallback in next.config.js ✅

```javascript
async rewrites() {
  // Use NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL, fallback to localhost
  // Ensure we always have a valid URL (not undefined)
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 'http://localhost:3001';
  
  // Validate the URL is not "undefined" string
  const validApiUrl = apiUrl === 'undefined' || !apiUrl ? 'http://localhost:3001' : apiUrl;
  
  return [
    {
      source: '/api/:path*',
      destination: `${validApiUrl}/:path*`,
    },
  ]
},
```

**What this does:**
1. Checks `NEXT_PUBLIC_API_BASE_URL` first
2. Falls back to `NEXT_PUBLIC_API_URL`
3. Falls back to `http://localhost:3001`
4. Extra validation to catch "undefined" string
5. Always returns a valid URL

### Fix 2: Add Variables to build.env ✅

```json
{
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://api.tikit-demo.com/api/v1",
      "NEXT_PUBLIC_API_BASE_URL": "https://api.tikit-demo.com",
      "NEXT_PUBLIC_APP_NAME": "TIKIT",
      "NEXT_PUBLIC_ENABLE_ANALYTICS": "false",
      "NEXT_PUBLIC_ENABLE_NOTIFICATIONS": "true"
    }
  },
  "env": {
    // Runtime variables still here
  }
}
```

**What this does:**
- Makes variables available during `next build`
- Ensures rewrites can read the API URL
- Provides working default values

## How It Works

### Build-Time Flow

1. Vercel starts build
2. Runs `npm run build`
3. Next.js evaluates `next.config.js`
4. Reads `rewrites()` function
5. Checks environment variables from `build.env`
6. Finds `NEXT_PUBLIC_API_BASE_URL` = "https://api.tikit-demo.com"
7. Sets rewrite destination to `https://api.tikit-demo.com/:path*`
8. ✅ Valid URL - build continues

### Fallback Chain

```
1. Try: process.env.NEXT_PUBLIC_API_BASE_URL
   └─ If defined: Use it ✅
   └─ If undefined: Continue to 2

2. Try: process.env.NEXT_PUBLIC_API_URL
   └─ If defined: Use it ✅
   └─ If undefined: Continue to 3

3. Fallback: 'http://localhost:3001'
   └─ Always defined ✅

4. Validation: Check if result is "undefined" string
   └─ If yes: Use localhost
   └─ If no: Use result
```

## Verification

### Test the Fix

**Scenario 1: With Environment Variables (Vercel)**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.tikit-demo.com npm run build
# Expected: Build succeeds, rewrite uses https://api.tikit-demo.com/:path*
```

**Scenario 2: Without Environment Variables (Local)**
```bash
npm run build
# Expected: Build succeeds, rewrite uses http://localhost:3001/:path*
```

**Scenario 3: Check Build Output**
```bash
npm run build 2>&1 | grep -i error
# Expected: No "Invalid rewrite" errors
```

### Expected Build Output

✅ **Success:**
```
> next build
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (31/31)
✓ Finalizing page optimization
```

❌ **Failure (old behavior):**
```
`destination` does not start with `/`, `http://`, or `https://`
Error: Invalid rewrite found
```

## Future Prevention

### Best Practices

1. **Always use build.env for build-time variables**
   ```json
   {
     "build": {
       "env": {
         "NEXT_PUBLIC_*": "value"
       }
     }
   }
   ```

2. **Add robust fallbacks in next.config.js**
   ```javascript
   const value = process.env.VAR1 || process.env.VAR2 || 'fallback';
   ```

3. **Validate environment variables**
   ```javascript
   if (value === 'undefined' || !value) {
     // Use fallback
   }
   ```

4. **Test builds without environment variables**
   ```bash
   unset NEXT_PUBLIC_API_URL
   npm run build
   ```

### Common Pitfalls

❌ **Don't:**
```javascript
// No fallback
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Only runtime env (won't work at build time)
"env": {
  "NEXT_PUBLIC_API_URL": "..."
}
```

✅ **Do:**
```javascript
// Multiple fallbacks
const apiUrl = process.env.VAR1 || process.env.VAR2 || 'fallback';

// Build-time env
"build": {
  "env": {
    "NEXT_PUBLIC_API_URL": "..."
  }
}
```

## Troubleshooting

### Build Still Fails?

1. **Check vercel.json has build.env section**
   ```json
   "build": {
     "env": {
       "NEXT_PUBLIC_API_BASE_URL": "https://..."
     }
   }
   ```

2. **Verify next.config.js has fallbacks**
   ```javascript
   const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
   ```

3. **Check for typos in environment variable names**
   - Must be exactly: `NEXT_PUBLIC_API_BASE_URL`
   - Case-sensitive

4. **Clear Vercel build cache**
   - Redeploy from Vercel dashboard
   - Or push new commit

### Debug Environment Variables

Add logging in next.config.js:

```javascript
async rewrites() {
  console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 'http://localhost:3001';
  
  console.log('Using API URL:', apiUrl);
  
  return [/* ... */];
}
```

Check Vercel build logs for these console outputs.

## Summary

### What Was Fixed

1. ✅ Added `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_API_URL` to `build.env`
2. ✅ Improved fallback chain in `next.config.js`
3. ✅ Added validation for "undefined" string
4. ✅ Ensured always valid URL format

### Result

- ✅ Build succeeds on Vercel
- ✅ Valid rewrite destination
- ✅ Works with or without environment variables
- ✅ Robust error handling

---

**Status:** ✅ FIXED

**Build Error:** Resolved  
**Deployment:** Working  
**Documentation:** Complete  

🚀 **Vercel deployments now succeed!**
