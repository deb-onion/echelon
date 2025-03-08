#!/bin/bash
# Cloudflare Pages build script

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la

# Navigate to frontend directory
echo "Changing to frontend directory..."
cd frontend || exit 1
echo "Now in: $(pwd)"

# Install dependencies with force flag to bypass version mismatches
echo "Installing dependencies..."
npm install --force

# Build the app
echo "Building the app..."
npm run build

echo "Build completed!" 