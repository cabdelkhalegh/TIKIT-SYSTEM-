# TIKIT-SYSTEM-

[![CI Pipeline](https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/actions/workflows/ci.yml/badge.svg)](https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/actions/workflows/test.yml/badge.svg)](https://github.com/cabdelkhalegh/TIKIT-SYSTEM-/actions/workflows/test.yml)

This is the repository for the TIKIT APP

## 🚀 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. All pull requests and commits to main branches are automatically tested.

### CI Workflow (`ci.yml`)

The CI pipeline runs on every push and pull request to `main`, `master`, and `develop` branches.

**What it does:**
- **Backend CI**: Builds, lints, and tests the backend application
  - Runs on Node.js 18.x and 20.x
  - Executes linting checks
  - Runs type checking
  - Builds the application
  - Runs unit and integration tests
  - Uploads code coverage reports

- **Frontend CI**: Builds, lints, and tests the frontend application
  - Runs on Node.js 18.x and 20.x
  - Executes linting checks
  - Runs type checking
  - Builds the production bundle
  - Runs unit tests
  - Uploads code coverage reports

- **CI Success Gate**: Ensures all checks pass before merge
  - Blocks merge if any job fails
  - Required for PR approval

### E2E Test Workflow (`test.yml`)

The E2E test workflow runs end-to-end tests with a full stack setup.

**What it does:**
- Spins up a PostgreSQL test database
- Builds and starts the backend server
- Builds the frontend application
- Runs end-to-end tests using Playwright
- Uploads test results and screenshots on failure

**Manual trigger**: You can manually trigger E2E tests from the Actions tab

### Running CI Locally

Before pushing your changes, you can run the same checks locally:

**Backend:**
```bash
cd backend
npm install
npm run lint
npm run type-check
npm run build
npm test
```

**Frontend:**
```bash
cd frontend
npm install
npm run lint
npm run type-check
npm run build
npm test
```

**E2E Tests:**
```bash
# Ensure backend and database are running
cd frontend
npm run test:e2e
```

### CI Status

- ✅ **Green**: All checks passed - safe to merge
- ❌ **Red**: One or more checks failed - review the logs
- 🟡 **Yellow**: Checks are running - please wait

### Workflow Configuration

The workflows are configured to:
- Run automatically on PR creation and updates
- Run on pushes to main/master/develop branches
- Cache dependencies for faster builds
- Run tests in parallel where possible
- Block merges if tests fail
- Upload coverage reports to Codecov (when configured)
