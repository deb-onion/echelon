# Deploying Echelon Frontend to Cloudflare Pages

This document provides detailed instructions for setting up and deploying the Echelon frontend to Cloudflare Pages using GitHub integration for continuous deployment.

## GitHub Integration Setup

### Prerequisites

- A GitHub account
- A Cloudflare account
- The Echelon repository pushed to GitHub
- Admin access to the GitHub repository

### Step 1: Push Your Code to GitHub

If you haven't already done so, push your code to GitHub:

```bash
# Initialize git repository if not already done
git init

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/yourusername/echelon.git

# Push to GitHub
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages

1. Log in to your Cloudflare account
2. Navigate to "Pages" from the left sidebar
3. Click "Create a project"
4. Select "Connect to Git"
5. If prompted, authorize Cloudflare to access your GitHub repositories
6. Select your Echelon repository from the list

### Step 3: Configure Build Settings

Configure your project with the following settings:

- **Project name**: `echelon` (or your preferred name)
- **Production branch**: `main` (or your primary branch)
- **Build command**: `cd frontend && npm ci && npm run build`
- **Build output directory**: `frontend/build`
- **Environment variables**:
  - Add variable: 
    - Name: `NODE_VERSION`
    - Value: `16`
  - Add variable:
    - Name: `REACT_APP_API_URL`
    - Value: `https://api.echelon-ads.com` (production API URL)

Click "Save and Deploy" to start the first build and deployment.

### Step 4: Configure Preview Deployments (Optional)

1. Go to the "Settings" tab of your Cloudflare Pages project
2. Under "Builds & deployments", configure preview deployments:
   - Enable preview deployments for pull requests
   - Set branch preview deployments for branches like `develop` or `staging`

### Step 5: Set Up Custom Domain (Optional)

1. Go to the "Custom domains" tab of your Cloudflare Pages project
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `echelon-ads.com`) and follow the verification steps
4. Cloudflare will automatically provision an SSL certificate

## Using GitHub Actions for Deployment (Alternative Method)

If you prefer to use GitHub Actions for deployment, follow these steps:

### Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Step 2: Ensure the Workflow File is Present

Make sure the GitHub Actions workflow file `ci_cd/cloudflare_pages.yml` is in your repository.

### Step 3: Push Changes to Trigger Deployment

Any push to the `main` or `develop` branches that includes changes to the `frontend` directory will automatically trigger the deployment workflow.

You can also manually trigger the workflow:
1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy Frontend to Cloudflare Pages" workflow
3. Click "Run workflow"
4. Select the branch and environment (production or staging)
5. Click "Run workflow"

## Environment-Specific Deployments

### Production Environment

- Automatically deployed when changes are pushed to the `main` branch
- Uses the production API URL: `https://api.echelon-ads.com`

### Staging Environment

- Automatically deployed when changes are pushed to the `develop` branch
- Uses the staging API URL: `https://api-staging.echelon-ads.com`

## Cloudflare Pages Configuration File

The `frontend/cloudflare.toml` file in the repository contains Cloudflare Pages-specific configurations:

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "16"

[site]
  bucket = "./build"
  entry-point = "workers-site"

[env.production]
  REACT_APP_API_URL = "https://api.echelon-ads.com"

[env.staging]
  REACT_APP_API_URL = "https://api-staging.echelon-ads.com"
```

This configuration file will be used by Cloudflare Pages if you select it during the project setup.

## Troubleshooting

### Build Failures

If your build fails:
1. Check the build logs in Cloudflare Pages
2. Ensure all dependencies are correctly specified in `package.json`
3. Verify that your build command is correct
4. Make sure the Node.js version is compatible with your code

### Deployment Issues

If deployment succeeds but the site doesn't work:
1. Check for JavaScript errors in the browser console
2. Verify that environment variables are correctly set
3. Make sure the API URL is correct and the API is accessible

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/) 