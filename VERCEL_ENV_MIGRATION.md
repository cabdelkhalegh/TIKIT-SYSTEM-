# Vercel Environment Variables Migration Guide

## What Changed?

The `env` section has been **removed** from `vercel.json` as it is deprecated by Vercel. As of 2024, Vercel recommends managing all environment variables through the Vercel Dashboard or CLI for security and best practices.

## Why This Change?

1. **Security**: Environment variables often contain sensitive data. Storing them in version-controlled files like `vercel.json` can expose secrets.
2. **Best Practice**: Vercel's platform encrypts environment variables when managed through the Dashboard/CLI.
3. **Deprecated Feature**: The `env` section in `vercel.json` is officially deprecated by Vercel.

## What's Still in vercel.json?

- **`build.env`**: Build-time environment variables are still defined in `vercel.json` and are used during the build process.
- These variables are available during `npm run build` and are baked into the static output.

## How to Set Environment Variables for Production

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Your backend API URL (e.g., `https://api.yourapp.com/api/v1`) | Production, Preview |
| `NEXT_PUBLIC_API_BASE_URL` | Your backend base URL (e.g., `https://api.yourapp.com`) | Production, Preview |
| `NEXT_PUBLIC_APP_NAME` | Your app name (e.g., `TIKIT`) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | Production |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` or `false` | Production, Preview, Development |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | `true` or `false` | Production, Preview, Development |

4. **Important**: After adding variables, trigger a new deployment for changes to take effect.

### Option 2: Using Vercel CLI

```bash
# Add a production environment variable
vercel env add NEXT_PUBLIC_API_URL production

# You'll be prompted to enter the value
# Repeat for other variables as needed

# List all environment variables
vercel env ls

# Pull environment variables to local .env file
vercel env pull .env.local
```

## For Local Development

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=TIKIT
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

**Note**: `.env.local` is gitignored and will not be committed to version control.

## Build-time vs Runtime Variables

### Build-time Variables (`build.env` in vercel.json)
- Available during `npm run build`
- Baked into the static output
- Used for `NEXT_PUBLIC_*` variables that need to be embedded in the client-side bundle
- Current values in `vercel.json` serve as **defaults for demo/development**

### Runtime Variables (Dashboard/CLI only)
- Available to serverless functions at runtime
- Can be changed without rebuilding
- More secure for sensitive data
- **Recommended for production deployments**

## Migration Checklist

- [x] Removed deprecated `env` section from `vercel.json`
- [x] Kept `build.env` for build-time defaults
- [ ] Set production environment variables in Vercel Dashboard
- [ ] Create `.env.local` for local development
- [ ] Redeploy after setting environment variables
- [ ] Verify application works with new configuration

## Troubleshooting

### Environment variable is undefined in production
- Check that the variable is set in Vercel Dashboard for the correct environment (Production/Preview)
- Trigger a new deployment after adding variables

### Build fails
- Ensure `build.env` in `vercel.json` has all required `NEXT_PUBLIC_*` variables
- Check build logs for specific error messages

### Local development not working
- Ensure `.env.local` file exists in the `frontend` directory
- Restart the development server after changing `.env.local`

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [How to Migrate from vercel.json env](https://vercel.com/kb/guide/how-do-i-migrate-away-from-vercel-json-env-and-build-env)
- [Vercel CLI Environment Commands](https://vercel.com/docs/cli/env)
