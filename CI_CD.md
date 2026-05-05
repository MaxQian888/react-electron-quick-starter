# CI/CD Pipeline Documentation

This document provides comprehensive information about the CI/CD pipeline configured for this React + Next.js + Electron project.

## Overview

The CI/CD pipeline is implemented using GitHub Actions and includes the following jobs:

1. **Code Quality & Security** - Linting, type checking, and security audits
2. **Test Suite** - Unit tests with coverage reporting
3. **Deploy Preview** - Automatic preview deployments for pull requests
4. **Deploy Production** - Production deployments (disabled by default)
5. **Build Electron** - Cross-platform desktop application builds
6. **Create Release** - Automated GitHub releases for tagged versions

## Workflow Triggers

The pipeline runs on:

- **Push** to `master` or `develop` branches via `.github/workflows/ci.yml`
- **Pull requests** to `master` or `develop` branches via `.github/workflows/ci.yml`
- **Tags** starting with `v` via `.github/workflows/release.yml`
- **Manual dispatch** for `.github/workflows/quality.yml` and `.github/workflows/test.yml` (for isolated debugging)

## Jobs Overview

### 1. Code Quality & Security

**Runs on:** Called by `ci.yml` / `release.yml` (or manual dispatch)  
**Duration:** ~2-3 minutes

This job performs:

- ESLint code linting
- TypeScript type checking (`tsc --noEmit`)
- Security audit of dependencies (`pnpm audit`)
- Check for outdated dependencies

**Note:** Some steps continue on error to avoid blocking the pipeline for warnings.

### 2. Test Suite

**Runs on:** Called by `ci.yml` / `release.yml` (or manual dispatch)  
**Duration:** ~3-5 minutes

This job performs:

- Runs all Jest tests with coverage
- Generates multiple coverage report formats (HTML, LCOV, Cobertura, JUnit)
- Uploads coverage to Codecov (if configured)
- Posts coverage summary as PR comment
- Publishes test results with annotations
- Builds the Next.js application
- Checks bundle size

**Coverage Thresholds:**

- Branches: 60%
- Functions: 60%
- Lines: 70%
- Statements: 70%

### 3. Deploy Preview

**Runs on:** Pull requests only  
**Duration:** ~2-3 minutes

Automatically deploys preview versions of the application for pull requests.

**Required Secrets:**

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Setup Instructions:**

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. Run `vercel link` in your project directory
4. Get your tokens:

   ```bash
   vercel whoami
   cat .vercel/project.json
   ```

5. Add secrets to GitHub repository settings

### 4. Deploy Production (DISABLED BY DEFAULT)

**Runs on:** Pushes to `master` branch (when enabled)  
**Duration:** ~2-3 minutes

⚠️ **This job is commented out by default for safety.**

**To Enable Production Deployments:**

1. **Set up GitHub Environment Protection:**
   - Go to `Settings > Environments`
   - Create a new environment named `production`
   - Add required reviewers (recommended)
   - Add deployment branch restrictions (optional)
   - Add environment secrets

2. **Configure Required Secrets:**
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

3. **Uncomment the job** in `.github/workflows/ci.yml`

4. **Update the environment URL** to match your production domain

**Additional Safety Measures:**

- Consider requiring specific labels on commits
- Only deploy on tagged releases
- Add time-based deployment windows
- Require manual approval via GitHub Environments

### 5. Build Electron Desktop Application

**Runs on:** All pushes and pull requests
**Duration:** ~5-12 minutes per platform

Builds cross-platform desktop applications for:

- **Linux** (x86_64): AppImage and .deb packages
- **Windows** (x64): MSI and NSIS installers
- **macOS** (x64 and ARM64): DMG and .zip bundles

**Platform-Specific Requirements:**

#### Linux (Ubuntu)

No additional native dependencies are needed — Electron ships its own Chromium runtime. `electron-builder` handles AppImage/deb packaging directly.

#### Windows

**Optional Code Signing (electron-builder):**

To enable code signing, add these secrets:

- `CSC_LINK` - Base64-encoded PFX certificate (or HTTPS URL)
- `CSC_KEY_PASSWORD` - Certificate password

**How to prepare the certificate:**

```powershell
# Convert PFX to base64
$bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File certificate.txt
```

Reference both env vars in `.github/workflows/build-electron.yml` (the env block is provided as a comment template).

#### macOS

**Optional Code Signing and Notarization:**

electron-builder accepts the following secrets:

- `APPLE_CERTIFICATE` - Base64-encoded .p12 certificate (often passed as `CSC_LINK` for electron-builder)
- `APPLE_CERTIFICATE_PASSWORD` - Certificate password (`CSC_KEY_PASSWORD`)
- `APPLE_SIGNING_IDENTITY` - Developer ID Application identity
- `APPLE_ID` - Apple ID email (`APPLE_ID`)
- `APPLE_PASSWORD` - App-specific password (`APPLE_APP_SPECIFIC_PASSWORD`)
- `APPLE_TEAM_ID` - Apple Developer Team ID

**How to prepare certificate:**

```bash
# Export certificate from Keychain as .p12, then convert to base64
base64 -i certificate.p12 -o certificate.txt
```

**How to create an app-specific password:**

1. Go to <https://appleid.apple.com>
2. Sign in with your Apple ID
3. Go to Security > App-Specific Passwords
4. Generate a new password

**Electron-builder Configuration:**

The `build` block in `package.json` is the source of truth. To enable signing/notarization:

```jsonc
{
  "build": {
    "mac": {
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "notarize": {
        "teamId": "YOUR_TEAM_ID",
      },
    },
    "win": {
      "signingHashAlgorithms": ["sha256"],
      "signAndEditExecutable": true,
    },
  },
}
```

### 6. Create Release

**Runs on:** Tags starting with `v` (e.g., `v1.0.0`)  
**Duration:** ~1-2 minutes

Automatically creates a GitHub release with all built artifacts when you push a version tag.

**How to Create a Release:**

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The release will be created as a **draft** with:

- Auto-generated release notes
- All platform-specific installers attached
- Changelog based on commits since last tag

**Review and publish the draft release manually** after verifying the artifacts.

## Caching Strategy

The pipeline uses multiple caching strategies to improve performance:

1. **pnpm Store Cache** - Caches downloaded packages (including the Electron binary)
2. **Next.js Build Cache** - Caches Next.js build outputs
3. **electron-builder Cache** - `~/.cache/electron-builder` and `~/.cache/electron` (covered automatically by `actions/setup-node` + pnpm cache for the install step)

**Expected Speed Improvements:**

- First run: ~10-15 minutes (full build, includes Electron binary download)
- Cached runs: ~3-6 minutes

## Concurrency Control

The pipeline uses concurrency groups to automatically cancel outdated workflow runs when new commits are pushed to the same branch or PR.

**Configuration:**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Artifacts

All jobs upload artifacts that are retained for 7-30 days:

| Artifact          | Retention | Description                  |
| ----------------- | --------- | ---------------------------- |
| `test-results`    | 30 days   | JUnit XML test results       |
| `coverage-report` | 30 days   | HTML coverage reports        |
| `nextjs-build`    | 7 days    | Built Next.js application    |
| `electron-*`      | 30 days   | Platform-specific installers |

## Required GitHub Secrets

### For Preview/Production Deployments (Optional)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### For Codecov Integration (Optional)

- `CODECOV_TOKEN`

### For Windows Code Signing (Optional)

- `CSC_LINK` (base64 PFX or HTTPS URL)
- `CSC_KEY_PASSWORD`

### For macOS Code Signing (Optional)

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

## Troubleshooting

### Tests Failing in CI but Passing Locally

1. Check Node.js version matches (20.x)
2. Ensure `pnpm-lock.yaml` is committed
3. Check for environment-specific issues
4. Review test logs in GitHub Actions

### Electron Build Failing

1. **All platforms:** Try a clean install — `rm -rf node_modules dist-electron release && pnpm install`
2. **Linux:** Verify the runner has FUSE 2 available (used by AppImage); GitHub-hosted Ubuntu has it by default.
3. **Windows / macOS:** Confirm `pnpm electron:compile` succeeds locally — most build failures are TS errors caught earlier.
4. Inspect `release/` artifacts when uploaded with `if-no-files-found: warn` — the workflow logs the directory listing.

### Code Signing Issues

1. Verify secrets are properly set in GitHub
2. Check certificate validity and expiration
3. Ensure signing identity matches certificate
4. Review electron-builder docs for platform-specific requirements: <https://www.electron.build/code-signing>

### Deployment Failures

1. Verify all required secrets are set
2. Check Vercel project configuration
3. Review deployment logs in GitHub Actions
4. Ensure build artifacts are generated correctly

## Best Practices

1. **Always test locally** before pushing
2. **Use feature branches** for development
3. **Create pull requests** for code review
4. **Tag releases** with semantic versioning (v1.0.0)
5. **Review draft releases** before publishing
6. **Monitor CI/CD costs** and optimize as needed
7. **Keep dependencies updated** regularly
8. **Review security audit** results

## Monitoring and Notifications

### GitHub Actions Dashboard

View workflow runs at: `https://github.com/YOUR_ORG/YOUR_REPO/actions`

### Email Notifications

Configure in: `Settings > Notifications > Actions`

### Slack Integration (Optional)

Add Slack notifications using the `slack-send` action.

## Cost Optimization

### GitHub Actions Minutes

- **Free tier:** 2,000 minutes/month for private repos
- **Paid plans:** Additional minutes available

### Optimization Tips

1. Use caching effectively (already implemented)
2. Cancel outdated runs (already implemented)
3. Run expensive jobs only when needed
4. Consider self-hosted runners for heavy workloads

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [electron-builder Documentation](https://www.electron.build/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [electron-builder Code Signing Guide](https://www.electron.build/code-signing)
