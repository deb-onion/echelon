# ECHELON: Google Ads Management System

## Overview

Echelon is a comprehensive Google Ads management platform designed to provide a streamlined interface for managing Google Ads accounts without directly accessing the Google Ads UI. This application combines a React frontend with a FastAPI backend to deliver powerful advertising management capabilities alongside AI-driven optimization suggestions.

- **Simplified Workflow**: Manage campaigns, view performance, and make optimizations all from one interface
- **E-commerce Focus**: Special tools for shopping campaigns and merchant feed management
- **AI-Powered**: Get intelligent suggestions to improve campaign performance
- **Time-Saving**: Automate repetitive tasks and focus on strategy

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
  - [Google API Setup](#google-api-setup)
  - [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
  - [Authentication](#authentication)
  - [Account Management](#account-management)
  - [Campaign Operations](#campaign-operations)
  - [E-commerce Tools](#e-commerce-tools)
  - [Performance Analysis](#performance-analysis)
- [API Documentation](#api-documentation)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding New Features](#adding-new-features)
  - [Testing](#testing)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Cloud Deployment](#cloud-deployment)
- [Troubleshooting](#troubleshooting)
- [Future Development](#future-development)

## Quick Start

If you're in a hurry, follow these steps to get Echelon running:

```bash
# Clone repository
git clone https://github.com/yourusername/echelon.git
cd echelon

# Set up backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Google API credentials
cd api
python app.py

# In another terminal, set up frontend
cd frontend
npm install
npm start
```

Navigate to `http://localhost:3000` to start using Echelon.

## Features

### Core Features

- **Dashboard**: Get a visual overview of account performance with key metrics
- **Campaign Management**: View, create, edit, and optimize campaigns
- **Budget Control**: Manage spending across multiple campaigns
- **Keyword Management**: Analyze and optimize keywords
- **Ad Creation**: Create and edit text, responsive, and image ads
- **Performance Tracking**: Track conversions, clicks, impressions, and more
- **Customizable Reports**: Build reports that focus on your KPIs

### E-commerce Specific Features

- **Shopping Campaign Management**: Create and optimize Google Shopping campaigns
- **Performance Max Campaign Support**: Leverage Google's newest campaign type
- **Merchant Center Integration**: Monitor product feed health
- **Product Performance Analysis**: Track which products drive performance
- **Feed Issue Resolution**: Quickly identify and fix product feed issues

### AI and Automation

- **Performance Suggestions**: Get AI-driven recommendations for improving campaigns
- **Bid Optimization**: Smart bidding recommendations based on performance
- **Budget Allocation**: Suggestions for optimizing budget across campaigns
- **Campaign Structure Analysis**: Get feedback on campaign organization

## System Architecture

Echelon consists of two main components:

### Frontend (React)

- Built with React and Material UI
- Chart.js for data visualization
- React Query for efficient data fetching
- Responsive design for desktop and tablet

### Backend (FastAPI)

- Python FastAPI framework
- Google Ads API client for campaign management
- Google Merchant Center API integration for product feed management
- JWT authentication
- Caching layer for performance

## Installation

### Prerequisites

- Python 3.9+
- Node.js 14+
- Google Ads API access
- Google Cloud Project with required APIs enabled
- Google Ads Developer Token

### Backend Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. Start the backend server:
   ```bash
   cd api
   python app.py
   ```

The API server will be available at `http://localhost:8000`.

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure frontend:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`.

## Configuration

### Google API Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Google Ads API
   - Google Merchant Center API
   - Google OAuth 2.0
3. Create OAuth credentials with the following scopes:
   - https://www.googleapis.com/auth/adwords
   - https://www.googleapis.com/auth/content
4. Create a Google Ads API Developer Token
5. Add your configuration to the `.env` file

### Environment Variables

Key environment variables include:

**Backend (.env in root)**
```
GOOGLE_ADS_CONFIG_DIR=./google-ads.yaml
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REDIRECT_URI=http://localhost:8000/auth/callback
SECRET_KEY=your_secret_key_for_jwt
```

**Frontend (.env in frontend directory)**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AUTH_URL=http://localhost:8000/auth
```

## Usage Guide

### Authentication

1. Access the Echelon dashboard at `http://localhost:3000`
2. Click "Login" and authorize with your Google account
3. Select your Google Ads account if you have access to multiple accounts

### Account Management

- **Switch Accounts**: Use the account selector in the top navigation
- **Account Summary**: View account-level performance on the dashboard
- **Settings**: Configure account-specific settings in the Settings page

### Campaign Operations

- **Create Campaign**: Use the "New Campaign" button on the Campaigns page
- **Edit Campaign**: Click on any campaign to view and edit details
- **Pause/Enable**: Toggle campaign status directly from the campaigns list
- **Budget Management**: Adjust campaign budgets from the campaign details page

### E-commerce Tools

- **Shopping Campaigns**: Create via the "New Campaign" > "Shopping" option
- **Product Feeds**: Access via the "Merchant Feed" section in the sidebar
- **Performance Max**: Create through the "New Campaign" > "Performance Max" option
- **Product Issues**: Review on the Merchant Feed dashboard

### Performance Analysis

- **Dashboard**: View key metrics for selected date ranges
- **Performance Charts**: Analyze trends over time
- **Campaign Comparison**: Compare multiple campaigns side by side
- **AI Suggestions**: Review and implement suggestions from the "Optimization" tab

## API Documentation

### Authentication Endpoints

- `GET /auth/login` - Begin OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/refresh` - Refresh access token
- `GET /auth/logout` - End session

### Campaign Endpoints

- `GET /campaigns` - List all campaigns
- `GET /campaigns/{campaign_id}` - Get campaign details
- `POST /campaigns` - Create new campaign
- `PUT /campaigns/{campaign_id}` - Update campaign
- `DELETE /campaigns/{campaign_id}` - Remove campaign

### E-commerce Endpoints

- `GET /ecommerce/performance` - Get shopping performance metrics
- `GET /ecommerce/products` - Get product performance data

### Merchant Center Endpoints

- `GET /merchants` - List Merchant Center accounts
- `GET /merchants/{merchant_id}` - Get merchant account details
- `GET /merchants/{merchant_id}/feeds` - List product feeds
- `GET /merchants/{merchant_id}/products` - List products in merchant account
- `GET /merchants/{merchant_id}/issues` - Get product issues
- `POST /merchants/{merchant_id}/feeds/upload` - Upload new feed

## Development

### Project Structure

```
echelon/
├── api/               # Main FastAPI application
├── src/               # Backend source code
│   ├── core/          # Core functionality
│   ├── models/        # Data models
│   ├── routes/        # API routes
│   └── tests/         # Backend tests
├── frontend/          # React frontend
│   ├── public/        # Static assets
│   └── src/           # Frontend source code
│       ├── components/  # React components
│       ├── pages/     # Page layouts
│       ├── services/  # API services
│       └── utils/     # Utility functions
└── scripts/           # Utility scripts
```

### Adding New Features

1. Create necessary models in `src/models/`
2. Implement backend functionality in `src/core/`
3. Add API routes in `src/routes/`
4. Create React components in `frontend/src/components/`
5. Add pages in `frontend/src/pages/`
6. Update API services in `frontend/src/services/`

### Testing

**Backend Tests**
```bash
cd src
pytest
```

**Frontend Tests**
```bash
cd frontend
npm test
```

## Deployment

### Docker Deployment

1. Build and run with docker-compose:
   ```bash
   docker-compose up -d
   ```

2. For production, use the production configuration:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment

#### Frontend (Cloudflare Pages)

1. Configure Cloudflare Pages to connect to your repository
2. Use the following build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/build`

#### Backend (Any Docker-compatible hosting)

1. Build the Docker image:
   ```bash
   docker build -t echelon-api .
   ```

2. Deploy to your hosting service with the proper environment variables

## Troubleshooting

### Common Issues

- **Authentication Failures**: Check your Google API credentials and OAuth configuration
- **API Rate Limits**: Implement proper caching and delay between requests
- **Missing Data**: Ensure your Google Ads account has the proper permissions
- **Slow Performance**: Optimize API calls and implement pagination

### Logs

- Backend logs are available in the terminal or `logs/api.log`
- Frontend errors are logged in the browser console
- For Docker deployments, use `docker logs echelon-api`

## Future Development

- **Advanced Reporting**: Custom report templates and export capabilities
- **Enhanced Automation**: Rule-based campaign adjustments
- **Multi-user Access**: User accounts with role-based permissions
- **Mobile Application**: Native mobile version for on-the-go management
- **Additional Ad Networks**: Expand beyond Google Ads to other platforms

---

## License

This project is proprietary and confidential. Unauthorized copying, transferring or reproduction of the contents of this project, via any medium is strictly prohibited.

---

Created for streamlining Google Ads management 