# Echelon Project Deployment: Bug Report

## Overview

This report documents the issues encountered during the deployment of the Echelon Google Ads Management System to Cloudflare Pages. The deployment process has faced multiple challenges related to dependency management, build configuration, and the separation of frontend and backend components.

## Environment Details

- **Git Repository**: https://github.com/deb-onion/echelon
- **Deployment Platform**: Cloudflare Pages
- **Local Development Environment**: Windows 10, PowerShell
- **Frontend Framework**: React with Material UI
- **Backend Framework**: Python FastAPI

## Bug #1: Package Version Mismatch in Frontend Build

### Description
The initial deployment attempt failed due to package version mismatches between package.json and package-lock.json files in the frontend directory.

### Error Message
```
npm ERR! code EUSAGE
npm ERR! `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
npm ERR! Invalid: lock file's typescript@5.8.2 does not satisfy typescript@4.9.5
```

### Root Cause
Cloudflare Pages was using `npm ci` for installation, which requires exact version matches between package.json and package-lock.json. The TypeScript version declared in package.json (4.9.5) didn't match the version in package-lock.json (5.8.2).

### Fix Attempted
Modified the build command to use `npm install --force` instead of `npm ci` to bypass version mismatch errors:
```
cd frontend && npm install --force && npm run build
```

### Status
✅ Fixed in commit but not yet applied by Cloudflare.

## Bug #2: Python Dependency Conflicts

### Description
Cloudflare Pages attempted to install Python dependencies from requirements.txt, which led to version conflicts between Google Ads API requirements and protobuf.

### Error Message
```
ERROR: Cannot install -r requirements.txt (line 2) and protobuf==4.21.12 because these package versions have conflicting dependencies.

The conflict is caused by:
    The user requested protobuf==4.21.12
    google-ads 18.0.0 depends on protobuf!=3.18.*, !=3.19.*, <=3.20.0 and >=3.12.0
```

### Root Cause
Cloudflare Pages was automatically detecting and installing Python dependencies despite this being a frontend-only deployment. The protobuf version requirements between different packages were incompatible.

### Fix Attempted
1. Created a `wrangler.toml` configuration file to instruct Cloudflare to focus only on the frontend build.
2. Updated the build script to remove requirements.txt before dependency installation.
3. Added environment variable `SKIP_PYTHON_DEPENDENCY_INSTALLATION` in wrangler.toml.
4. Created an `ignore-backend.txt` file as an additional signal to skip backend dependencies.
5. Implemented a new `cloudflare-deploy.sh` script specifically for frontend deployment.

### Status
⚠️ Fix attempted but not yet confirmed. Cloudflare appears to be using an older commit.

## Bug #3: Git Branch Synchronization Issues

### Description
Cloudflare Pages was not using the latest commits from the repository, resulting in deployment attempts using older configurations that still had the dependency issues.

### Error Evidence
The deployment logs showed Cloudflare using commit c75af83b rather than the latest commits containing the fixes:
```
From https://github.com/deb-onion/echelon
 * branch c75af83b6118e3d6d01687fc1165ac7f9a355915 -> FETCH_HEAD

HEAD is now at c75af83 Fix Cloudflare Pages deployment configuration
```

### Root Cause
Cloudflare Pages was either caching an older version of the repository or the deployment was manually initiated with an older commit.

### Fix Attempted
Pushed multiple new commits with different approaches to fixing the deployment issues.

### Status
⚠️ In progress. Need to ensure Cloudflare Pages is using the latest commit from the master branch.

## Bug #4: Build Configuration Recognition

### Description
Cloudflare Pages did not recognize the wrangler.toml configuration file that we added to control the build process.

### Error Evidence
```
Checking for configuration in a Wrangler configuration file (BETA)
No wrangler.toml file found. Continuing.
```

### Root Cause
Possibly related to Bug #3 (using older commits), or Cloudflare may have strict requirements for the location or format of the wrangler.toml file.

### Fix Attempted
1. Created a new wrangler.toml file with explicit configuration.
2. Added a package.json in the root directory with build scripts.
3. Created .node-version file to specify Node.js version.

### Status
⚠️ In progress. Need to determine why Cloudflare isn't recognizing the configuration files.

## Bug #5: Mixed Frontend/Backend Project Structure

### Description
The project structure combines both frontend and backend components in a single repository, but Cloudflare Pages is primarily designed for frontend deployments.

### Root Cause
The project architecture doesn't clearly separate frontend and backend for deployment purposes, leading to confusion in the build process about which components to install and build.

### Fix Attempted
1. Created clear separation signals through configuration files.
2. Implemented build scripts that focus exclusively on the frontend.
3. Added safeguards to remove backend-related files during the build process.

### Status
⚠️ In progress. Need to establish a cleaner separation for deployment purposes.

## Recommended Next Steps

1. **Manual Deployment Override**: Use Cloudflare's Direct Upload feature to bypass the Git integration temporarily.

2. **Repository Restructuring**: Consider reorganizing the repository to have clearer separation between frontend and backend components:
   ```
   /
   ├── frontend/       # React application
   ├── backend/        # FastAPI application
   └── README.md
   ```

3. **Split Deployment Strategy**: 
   - Deploy frontend to Cloudflare Pages
   - Deploy backend separately to a platform better suited for Python applications (AWS Lambda, Google Cloud Run, etc.)

4. **Package Configuration Updates**: Fix the version mismatches in package.json and package-lock.json by regenerating the lock file.

5. **Explicit Build Commands**: Provide explicit frontend-only build commands in the Cloudflare Pages UI:
   ```
   Build command: cd frontend && npm install --force && npm run build
   Build output directory: frontend/build
   ```

## Impact Assessment

These deployment issues are currently preventing the application from being accessible to users. The frontend cannot be deployed due to configuration and dependency issues, while the backend requires a separate deployment strategy.

The core functionality of the application remains intact, but the deployment pipeline requires significant adjustments to accommodate the mixed nature of the codebase.

## Timeline of Debug Attempts

1. Initial deployment attempted with default settings → Failed due to package version mismatches
2. Modified build command to use `npm install --force` → Failed due to Python dependency conflicts
3. Added wrangler.toml configuration → Failed due to Git sync issues
4. Created custom build scripts → Pending results
5. Added ignore-backend.txt and cloudflare-deploy.sh → Pending results

## Conclusion

The deployment issues stem from a combination of package version mismatches, dependency conflicts, and the mixed nature of the repository. The recommended approach is to clearly separate frontend and backend deployments, while ensuring Cloudflare Pages focuses exclusively on the React frontend.

Progress is being made on resolving these issues, with several fixes already implemented. Continued monitoring and adjustments to the deployment strategy will be necessary to achieve a stable production environment. 