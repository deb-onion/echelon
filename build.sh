#!/bin/bash
# Cloudflare Pages build script

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Listing top-level files and directories:"
ls -la

# Delete requirements.txt to prevent Cloudflare from trying to install Python dependencies
echo "Removing requirements.txt to prevent Python dependency installation..."
if [ -f requirements.txt ]; then
  rm requirements.txt
  echo "requirements.txt removed"
fi

# Navigate to frontend directory
echo "Changing to frontend directory..."
cd frontend || exit 1
echo "Now in: $(pwd)"

# List package.json to verify we're in the right place
echo "Listing package.json:"
ls -la package.json

# Install dependencies with force flag to bypass version mismatches
echo "Installing dependencies..."
npm install --force

# Build the app
echo "Building the app..."
npm run build

echo "Build completed successfully!"
ls -la build 