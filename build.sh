#!/bin/bash

# This script is used by Cloudflare Pages to build the frontend

echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Build complete!" 