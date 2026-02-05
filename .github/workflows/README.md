# GitHub Actions Workflows Documentation

This document provides detailed information about the CI/CD workflows configured for the TIKIT-SYSTEM project.

## Overview

The project uses two main GitHub Actions workflows:
1. **CI Pipeline** (`ci.yml`) - Continuous Integration for build, lint, and test
2. **E2E Tests** (`test.yml`) - End-to-end testing with full stack

## Workflow Files

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests targeting `main`, `master`, or `develop` branches

**Jobs:**

#### Backend CI Job
- **Purpose**: Validates backend code quality and functionality
- **Node Versions**: 18.x and 20.x (matrix build)
- **Steps**:
  1. Checkout repository code
  2. Setup Node.js with caching
  3. Install dependencies with `npm ci`
  4. Run ESLint/TSLint for code quality
  5. Run TypeScript type checking
  6. Build the application
  7. Run unit and integration tests
  8. Upload coverage to Codecov (Node 20.x only)

- **Environment**: 
  - Working directory: `./backend`
  - Test environment: `NODE_ENV=test`

#### Frontend CI Job
- **Purpose**: Validates frontend code quality and functionality
- **Node Versions**: 18.x and 20.x (matrix build)
- **Steps**:
  1. Checkout repository code
  2. Setup Node.js with caching
  3. Install dependencies with `npm ci`
  4. Run ESLint for code quality
  5. Run TypeScript type checking
  6. Build production bundle
  7. Run unit tests (Jest/Vitest)
  8. Upload coverage to Codecov (Node 20.x only)

- **Environment**:
  - Working directory: `./frontend`
  - Build environment: `NODE_ENV=production`
  - Test environment: `NODE_ENV=test`

#### CI Success Gate Job
- **Purpose**: Aggregates results from all CI jobs
- **Behavior**: 
  - Depends on both backend and frontend jobs
  - Runs always (even if dependencies fail)
  - Fails if any dependent job fails
  - Provides clear success/failure status

**Required Scripts in package.json:**

Backend (`backend/package.json`):
```json
{
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "build": "tsc",
    "test": "jest"
  }
}
```

Frontend (`frontend/package.json`):
```json
{
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "build": "next build",
    "test": "jest"
  }
}
```

### 2. E2E Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests targeting `main`, `master`, or `develop` branches
- Manual workflow dispatch (via GitHub UI)

**Services:**
- **PostgreSQL 14**: Test database with health checks
  - Database: `tikitdb_test`
  - User: `test_user`
  - Password: `test_password`
  - Port: 5432

**Job: E2E Tests**
- **Purpose**: Run end-to-end tests with full application stack
- **Node Version**: 20.x
- **Steps**:
  1. Checkout repository code
  2. Setup Node.js with caching
  3. Install backend dependencies
  4. Install frontend dependencies
  5. Build backend application
  6. Build frontend application
  7. Start backend server in background
  8. Wait for backend health check
  9. Run Playwright E2E tests
  10. Upload test results and screenshots

- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `NEXT_PUBLIC_API_URL`: Backend API endpoint
  - `NODE_ENV`: test
  - `PORT`: 3001

**Artifacts:**
- Test results (retained for 30 days)
- Screenshots on failure (retained for 7 days)
- Playwright reports

**Required Scripts in package.json:**

Frontend (`frontend/package.json`):
```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

Backend (`backend/package.json`):
```json
{
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

## Workflow Features

### Dependency Caching
- Both workflows cache npm dependencies
- Significantly reduces CI run time
- Cache key based on `package-lock.json`

### Matrix Builds
- CI workflow tests against multiple Node.js versions
- Ensures compatibility across versions
- Early detection of version-specific issues

### Fail-Fast Behavior
- Tests must pass for PR to be merged
- CI Success gate job enforces this
- Clear failure messages in PR checks

### Coverage Reports
- Automatic upload to Codecov
- Separate flags for backend and frontend
- Only uploads from Node 20.x builds

### Error Handling
- Type checking continues on error during transition
- E2E tests gracefully handle missing scripts
- Coverage upload failures don't block CI

## Branch Protection Rules

To enforce CI checks, configure branch protection rules:

1. Go to **Settings** → **Branches**
2. Add rule for `main`/`master` branch
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Select required status checks:
   - ✅ Backend CI (18.x)
   - ✅ Backend CI (20.x)
   - ✅ Frontend CI (18.x)
   - ✅ Frontend CI (20.x)
   - ✅ CI Success

## Troubleshooting

### Common Issues

**1. "npm ci" fails**
- Ensure `package-lock.json` is committed
- Run `npm install` locally to generate lock file
- Commit and push the lock file

**2. "npm run lint" not found**
- Add lint script to `package.json`
- Install ESLint: `npm install --save-dev eslint`
- Configure ESLint with `.eslintrc.json`

**3. "npm run build" fails**
- Check TypeScript configuration
- Ensure all dependencies are listed in `package.json`
- Verify build script in `package.json`

**4. E2E tests timeout**
- Backend may not be starting correctly
- Check health endpoint exists at `/health`
- Increase timeout in workflow if needed

**5. Coverage upload fails**
- This is non-blocking (continue-on-error)
- Configure Codecov token in repository secrets
- Add `CODECOV_TOKEN` to repository secrets

## Best Practices

1. **Run tests locally before pushing**
   - Saves CI resources
   - Faster feedback cycle

2. **Keep workflows up to date**
   - Update action versions regularly
   - Monitor for deprecation warnings

3. **Use semantic commit messages**
   - Helps track changes in CI logs
   - Better for debugging failures

4. **Monitor CI performance**
   - Review run times regularly
   - Optimize slow tests
   - Consider splitting large test suites

5. **Keep dependencies updated**
   - Regular dependency updates
   - Monitor security advisories
   - Test thoroughly after updates

## Future Enhancements

Planned improvements:
- [ ] Add deployment workflows (staging, production)
- [ ] Implement semantic versioning automation
- [ ] Add performance testing
- [ ] Add visual regression testing
- [ ] Add security scanning (Snyk, OWASP)
- [ ] Add Docker image building and publishing
- [ ] Add automatic PR labeling
- [ ] Add changelog generation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)
- [Playwright Documentation](https://playwright.dev/)
