# Echelon Google Ads Management System: Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [AI Engine](#ai-engine)
5. [Account Management](#account-management)
6. [Bulk Operations](#bulk-operations)
7. [Monitoring & Reporting](#monitoring--reporting)
8. [User Interface](#user-interface)
9. [API Backend](#api-backend)
10. [Practical Workflows](#practical-workflows) 
11. [Requirements for Full Functionality](#requirements-for-full-functionality)
12. [Installation and Setup](#installation-and-setup)
13. [Deployment Options](#deployment-options)

## Introduction

Echelon is a comprehensive Google Ads management system with powerful AI-driven optimization capabilities. It's designed to manage multiple Google Ads accounts with a focus on account isolation, meaning operations on one account don't affect others. The system leverages machine learning to provide smart recommendations for bid adjustments, budget allocation, and performance improvements.

### Key Features

- **Account Isolation**: Each account operates independently, keeping data and operations separate
- **AI-Powered Optimization**: Machine learning models analyze performance and make recommendations
- **Human-in-the-Loop**: All AI suggestions can be reviewed before implementation
- **Comprehensive Campaign Management**: Create, update, and optimize various campaign types
- **Visual Dashboard**: Interactive UI for reviewing and applying optimization suggestions
- **Detailed Reporting**: Generate visual reports and track performance metrics

## Project Structure

The project follows a modular, well-organized structure that separates core functionality from account-specific code:

```
📂 /
│── 📂 src/                                      # Main source code
│   │── 📂 core/                                 # Core functionalities
│   │── 📂 ai_engine/                            # AI optimization capabilities
│   │── 📂 accounts/                             # Account-specific operations
│   │── 📂 bulk_operations/                      # Bulk operation tools
│   │── 📂 multi_account_monitoring/             # Monitoring across accounts
│   │── 📂 looker_studio_dashboard/              # Reporting integrations
│   │── 📂 dashboard/                            # Flask web dashboard
│── 📂 frontend/                                 # React frontend application
│── 📂 api/                                      # FastAPI backend
│── 📂 config/                                   # Configuration files
│── 📂 logs/                                     # Logging directory
│── 📂 ci_cd/                                    # Deployment configuration
```

Let's explore each component in detail.

## Core Components

The core functionality is implemented in the `src/core` directory:

### Authentication System (`authentication.py`)

**Purpose**: Handles OAuth 2.0 authentication with Google Ads API.

**Key Functions**:
- `GoogleAdsAuthentication`: Main class that manages authentication
- `authenticate()`: Obtains or refreshes OAuth credentials
- `get_google_ads_client()`: Returns a configured API client
- `get_authenticated_client()`: Helper function to simplify authentication

**Use Case**:
Before accessing Google Ads data, you need to authenticate. This module manages the OAuth 2.0 flow, refreshes expired tokens, and stores credentials securely.

```python
# Example: Authenticating with Google Ads
from src.core.authentication import get_authenticated_client

client, account_id = get_authenticated_client(config_dir="config", account_id="123-456-7890")
# Now you can use the client to access Google Ads API
```

### API Client (`api_client.py`)

**Purpose**: Provides a standardized interface to the Google Ads API.

**Key Functions**:
- `GoogleAdsApiClient`: Main client class
- `execute_query()`: Executes GAQL (Google Ads Query Language) queries
- `get_campaign_list()`: Retrieves campaigns from the account
- `get_account_info()`: Gets basic information about the account

**Use Case**:
This is the main interface for retrieving data from Google Ads. It handles API versioning, service instantiation, and query execution.

```python
# Example: Getting a list of campaigns
from src.core.api_client import GoogleAdsApiClient

client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")
campaigns = client.get_campaign_list(status_filter=["ENABLED"])
```

### Request Handler (`request_handler.py`)

**Purpose**: Manages API requests, rate limiting, and error handling.

**Key Functions**:
- `RateLimiter`: Implements token bucket algorithm for API request rate limiting
- `RequestHandler`: Manages retries, backoff, and error handling
- `with_retry`: Decorator to add retry logic to functions

**Use Case**:
Google Ads API has rate limits and can return temporary errors. This module ensures your requests stay within limits and handles retries.

```python
# Example: Using retry decorator
from src.core.request_handler import with_retry

@with_retry(max_retries=3, retry_delay=2.0)
def fetch_data(client, query):
    # This function will be retried up to 3 times if it fails
    return client.execute_query(query)
```

### Utilities (`utilities.py`)

**Purpose**: Provides common utility functions used throughout the system.

**Key Functions**:
- `setup_logging()`: Configures logging for the application
- `validate_customer_id()`: Validates Google Ads customer ID format
- `format_date()`: Standardizes date formatting
- `micros_to_currency()`: Converts micro amounts to regular currency

**Use Case**:
These utilities simplify repetitive tasks and ensure consistency across the application.

```python
# Example: Converting micros to currency
from src.core.utilities import micros_to_currency

# Google Ads returns monetary values in micros (millionths)
budget_micros = 50000000  # 50 USD in micros
budget = micros_to_currency(budget_micros)  # Returns 50.0
```

## AI Engine

The AI engine is the brain of Echelon, providing intelligent optimization recommendations:

### AI Optimizer (`ai_optimizer.py`)

**Purpose**: Analyzes campaign performance data and generates optimization recommendations.

**Key Functions**:
- `AICampaignOptimizer`: Main AI optimization class
- `train_models()`: Trains machine learning models on historical data
- `get_campaign_recommendations()`: Generates improvement suggestions
- `optimize_campaign()`: Applies optimizations (with human approval)

**Models Implemented**:
1. **Bid Optimization Model**: Suggests optimal CPA/CPC adjustments
2. **Budget Allocation Model**: Recommends budget changes based on performance
3. **Performance Prediction Model**: Forecasts future results with different settings

**Use Case**:
The AI engine analyzes performance patterns to identify opportunities. For example, if a campaign is spending too much per conversion, it might recommend reducing bids or targeting different keywords.

```python
# Example: Getting AI recommendations
from src.ai_engine.ai_optimizer import AICampaignOptimizer
from src.core.api_client import GoogleAdsApiClient

client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")
optimizer = AICampaignOptimizer(client, model_dir="models")

# Get recommendations for a campaign
recommendations = optimizer.get_campaign_recommendations(campaign_id="1234567890")
print(f"Health Score: {recommendations['overall_health_score']}/100")
print(f"Suggested bid adjustment: {recommendations['bid_adjustments']['adjustment_percentage']}%")
```

## Account Management

The account management structure is the core organizational principle of Echelon:

### Account Structure

Each account has its own isolated directory under `src/accounts/` with a standardized structure:

```
📂 account_X/
│── 📂 campaigns/                    # Campaign management
│── 📂 budget/                       # Budget management
│── 📂 optimization/                 # Account-specific optimizations
│── 📂 alerts/                       # Alert configurations
│── 📂 reports/                      # Reporting functions
│── 📜 settings.json                 # Account settings
```

### Campaign Management

**Purpose**: Provides tools to create and manage various campaign types.

**Key Functions**:
- `SearchCampaignCreator`: Creates and configures Search campaigns
- `create_campaign()`: Creates a new campaign
- `create_ad_group()`: Adds ad groups to a campaign
- `add_keywords()`: Adds keywords to an ad group
- `create_text_ads()`: Creates ad creatives

**Use Case**:
Campaign management tools let you create and modify campaigns programmatically. For example, you could create a weekly sale campaign based on a template.

```python
# Example: Creating a search campaign
from src.core.api_client import GoogleAdsApiClient
from src.accounts.account_1.campaigns.create_search_campaign import SearchCampaignCreator

client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")
creator = SearchCampaignCreator(client, config_dir="config")

# Create a new search campaign
campaign_id = creator.create_campaign(
    campaign_name="Summer Sale 2023",
    budget_amount=100.0,
    bidding_strategy="MAXIMIZE_CONVERSIONS",
    status="PAUSED"  # Start as paused for review
)
```

### Campaign Retriever (`retrieve_campaigns.py`)

**Purpose**: Retrieves existing campaigns and applies optimization workflows.

**Key Functions**:
- `CampaignRetriever`: Main class for retrieving campaign data
- `get_campaign_list()`: Gets a list of campaigns in the account
- `get_campaign_details()`: Gets details for a specific campaign
- `optimize_campaign()`: Applies AI optimization to a specific campaign

**Use Case**:
When working with existing campaigns, this tool helps you retrieve and optimize them.

```python
# Example: Getting campaign details
from src.core.api_client import GoogleAdsApiClient
from src.accounts.account_1.campaigns.retrieve_campaigns import CampaignRetriever

client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")
retriever = CampaignRetriever(client, config_dir="config")

# Get campaign details
details = retriever.get_campaign_details(campaign_id="1234567890")
print(f"Campaign name: {details['campaign'].get('name')}")
```

### Account Settings (`settings.json`)

**Purpose**: Stores account-specific configuration and preferences.

**Key Sections**:
- **Account Info**: Basic account identification
- **Optimization Settings**: Thresholds and limits for AI optimizations
- **Bidding Settings**: Default bidding strategies and amounts
- **Targeting Settings**: Default geographic and language targets
- **Notification Settings**: Alert preferences and contact info
- **Reporting Settings**: Report configuration

**Use Case**:
Settings provide account-specific configuration without changing code. For example, one account might set more aggressive optimization thresholds than another.

```json
// Example settings that limit budget increase to 20%
"optimization_settings": {
    "max_budget_increase_percent": 20
}
```

## Bulk Operations

Tools for performing operations across campaigns in an account:

### Account Optimizer (`account_optimizer.py`)

**Purpose**: Handles AI optimization across an entire account, with human review.

**Key Functions**:
- `AccountOptimizer`: Main class for account-wide optimizations
- `generate_recommendations()`: Creates recommendations for all campaigns
- `display_recommendations()`: Shows suggestions in a visual format
- `review_and_apply_changes()`: Interactively applies approved changes

**Use Case**:
When you want to review and potentially apply optimizations across your account, this tool shows you suggestions in a tabular format and lets you approve each change individually.

```python
# Example: Reviewing and applying optimization suggestions
from src.bulk_operations.account_optimizer import AccountOptimizer

optimizer = AccountOptimizer(account_id="123-456-7890")

# Generate recommendations for all campaigns
optimizer.generate_recommendations()

# Display recommendations in a tabular format
optimizer.display_recommendations()

# Interactively review and apply changes
results = optimizer.review_and_apply_changes(interactive=True)
```

### Demo AI Suggestions (`demo_ai_suggestions.py`)

**Purpose**: Demonstrates AI optimization suggestions in a visual format.

**Key Functions**:
- `main()`: Runs the demo, showing AI suggestions in a tabular view

**Use Case**:
This is a user-friendly way to view all AI suggestions for an account in a tabular format.

```bash
# Example: Running the demo script
python -m src.demo_ai_suggestions --account "123-456-7890" --save "recommendations.json"
```

## User Interface

Echelon provides a modern web-based user interface for visualizing AI recommendations and selectively applying them:

### React Frontend Application

Located in the `frontend/` directory, this is a modern React application built with:

- **React**: Core library for building the UI
- **Material UI**: Component library for a consistent, professional look
- **React Query**: Data fetching and caching
- **Chart.js**: For visualizations of campaign performance and health
- **React Router**: For navigation between different sections

**Key Features**:
- Account selection
- Campaign dashboard
- Visual representation of AI recommendations
- Filtering and sorting options
- Interactive selection of which recommendations to apply
- Confirmation dialogs for applying changes

**Example UI Components**:

1. **Recommendations Dashboard**:
   - Campaign health doughnut chart
   - Recommendations summary cards
   - Table of all recommendations with selection checkboxes
   - Actions to apply selected recommendations

2. **Campaign Details Page**:
   - Performance metrics
   - Historical data charts
   - Ad group information
   - Campaign-specific recommendations

### Cloudflare Pages Deployment

The frontend is designed to be deployed on Cloudflare Pages for global distribution and performance:

- Configuration via `cloudflare.toml`
- Environment-specific settings for production and staging
- API URL configuration for different environments

**Benefits**:
- Global CDN distribution
- Free SSL certificates
- Edge caching for fast performance
- Built-in CI/CD from GitHub

## API Backend

Echelon's backend API, located in the `api/` directory, provides a RESTful interface for the frontend:

### FastAPI Application

**Purpose**: Provides API endpoints for the frontend to interact with the core functionality.

**Key Endpoints**:
- `/accounts`: List available accounts
- `/campaigns`: Get campaigns for an account
- `/campaigns/{campaign_id}`: Get details for a specific campaign
- `/recommendations`: Get account-wide recommendations
- `/recommendations/{campaign_id}`: Get recommendations for a specific campaign
- `/apply-recommendations`: Apply selected recommendations

**Features**:
- Automatic OpenAPI documentation
- Input validation with Pydantic models
- CORS configuration for frontend access
- Error handling and logging
- Client caching for improved performance

**Example API Response (Recommendations)**:
```json
{
  "recommendations": [
    {
      "campaign_id": "1234567890",
      "campaign_name": "Summer Sale 2023",
      "health_score": 75,
      "bid_adjustment": "+10.5%",
      "budget_adjustment": "-5.2%",
      "improvement_count": 3,
      "has_recommendations": true
    },
    ...
  ]
}
```

### Docker Deployment

The API backend is containerized for easy deployment:

- Dockerfile with Python 3.10
- Gunicorn WSGI server with Uvicorn workers
- Environment variable configuration
- Volume mounts for config and logs

**Benefits**:
- Consistent environment
- Scalable deployment
- Easy updates
- Works on any cloud provider supporting containers

## Practical Workflows

Here are step-by-step examples of common workflows in Echelon:

### 1. Daily Optimization Review Workflow

This workflow shows how to review and apply AI optimization suggestions:

#### Command Line Approach:

1. **Generate recommendations** for an account:
   ```bash
   python -m src.demo_ai_suggestions --account "123-456-7890" --save "recommendations/daily_2023-03-08.json"
   ```

2. **Review the recommendations** in the visual display to understand what the AI is suggesting.

3. **Selectively apply changes** by running:
   ```bash
   python -m src.bulk_operations.account_optimizer --account "123-456-7890" --action apply --input "recommendations/daily_2023-03-08.json"
   ```

#### Web Dashboard Approach:

1. **Visit the web dashboard** at your deployed URL (e.g., `https://echelon-ads.com`)

2. **Select your account** from the dropdown menu

3. **Navigate to Recommendations** tab to see all AI suggestions

4. **Review the visualizations and tables** of recommendations:
   - Health score doughnut chart
   - Campaign metrics
   - Suggested bid and budget adjustments

5. **Select recommendations to apply** using the checkboxes

6. **Click "Apply Selected"** and confirm to apply the changes

### 2. Creating a New Campaign Workflow

This workflow shows how to create a new search campaign:

1. **Initialize the API client**:
   ```python
   from src.core.api_client import GoogleAdsApiClient
   
   client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")
   ```

2. **Create a campaign creator**:
   ```python
   from src.accounts.account_1.campaigns.create_search_campaign import SearchCampaignCreator
   
   creator = SearchCampaignCreator(client, config_dir="config")
   ```

3. **Define ad groups with keywords and ads**:
   ```python
   ad_groups = [
       {
           'name': 'Brand Terms',
           'keywords': ['brand name', 'company name', 'product name'],
           'match_types': ['EXACT', 'PHRASE'],
           'headlines': [
               'Official Brand Website',
               'Shop Brand Products Online',
               'Official Site - Free Shipping'
           ],
           'descriptions': [
               'Shop our entire collection. Free shipping on orders over $50.',
               'Quality products at competitive prices. Order today!'
           ],
           'final_url': 'https://www.example.com/shop',
           'path1': 'shop',
           'path2': 'official'
       }
   ]
   ```

4. **Create the complete campaign**:
   ```python
   result = creator.create_complete_search_campaign(
       campaign_name='Summer Promotion 2023',
       ad_groups=ad_groups,
       budget_amount=50.0,
       bidding_strategy='MAXIMIZE_CONVERSIONS',
       status='PAUSED'  # Start paused for review
   )
   ```

5. **Review and publish the campaign** through the Google Ads interface or using the API.

## Requirements for Full Functionality

To make Echelon fully functional in a production environment, the following components still need to be implemented or configured:

### 1. Google Ads API Authentication

**Required Components**:
- Google Cloud Console project with Google Ads API enabled
- OAuth client ID and secret
- Developer token from Google Ads
- Valid refresh token obtained through OAuth flow

**Implementation Steps**:
1. Create a project in Google Cloud Console
2. Enable the Google Ads API
3. Create OAuth credentials
4. Update the `config/google-ads.yaml` file with your credentials
5. Run an initial OAuth flow to get a refresh token

### 2. Machine Learning Model Training Data

**Required Components**:
- Historical campaign performance data
- Minimum data points for model training (100+ data points recommended)

**Implementation Steps**:
1. Run campaigns for a period to collect data
2. Ensure conversion tracking is set up correctly
3. Use the AI optimizer's training functionality to build models

### 3. User Authentication

**Required Components**:
- Authentication provider integration (Auth0, Firebase, etc.)
- Role-based access control
- JWT token handling

**Implementation Steps**:
1. Choose an authentication provider
2. Implement token validation in the API
3. Add user management to the frontend
4. Configure roles and permissions

### 4. Deployment Infrastructure

**Required Components**:
- Server or cloud environment
- Database for persistent storage
- Scheduled job execution for automation

**Implementation Steps**:
1. Set up CI/CD pipeline using the configurations in `ci_cd/`
2. Deploy frontend to Cloudflare Pages
3. Deploy API to cloud provider (AWS/GCP/Azure)
4. Configure automated backups
5. Set up scheduled tasks

### 5. Security Enhancements

**Required Components**:
- Encryption for sensitive data
- API key management
- IP restrictions

**Implementation Steps**:
1. Implement encryption for credentials and tokens
2. Add API key validation
3. Configure IP allowlisting

## Installation and Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher (for frontend)
- Google Ads API access
- OAuth credentials

### Installation Steps

#### Backend Setup:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/echelon.git
   cd echelon
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv env
   
   # On Windows
   env\Scripts\activate
   
   # On macOS/Linux
   source env/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Google Ads API credentials**:
   - Edit `config/google-ads.yaml` with your credentials
   - Run a manual OAuth flow (implementation-specific)

5. **Set up account settings**:
   - Create/edit `src/accounts/account_X/settings.json` for each account

#### Frontend Setup:

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Create a `.env.local` file with:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

5. **Start API backend**:
   ```bash
   cd api
   uvicorn app:app --reload
   ```

## Deployment Options

Echelon can be deployed in several ways:

### 1. Frontend Deployment (Cloudflare Pages)

#### Manual Deployment

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
# Either connect GitHub repository in Cloudflare dashboard
# Or use Wrangler CLI:
npx wrangler pages publish build
```

#### GitHub Integration with Cloudflare Pages

For continuous deployment with GitHub:

1. **Push your project to GitHub**:
   ```bash
   # Initialize git in your project (if not already done)
   cd /path/to/echelon
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create a new repository on GitHub, then push your code
   git remote add origin https://github.com/yourusername/echelon.git
   git push -u origin main
   ```

2. **Connect your GitHub repository to Cloudflare Pages**:
   - Log in to your Cloudflare account and navigate to the Pages tab
   - Click "Create a project" and select "Connect to Git"
   - Authorize Cloudflare to access your GitHub repositories
   - Select your Echelon repository

3. **Configure build settings**:
   - Set build command: `cd frontend && npm ci && npm run build`
   - Set build output directory: `frontend/build`
   - Add environment variables:
     - `NODE_VERSION`: `16` (or your preferred Node.js version)
     - `REACT_APP_API_URL`: Your API endpoint URL

4. **Configure deployment branches**:
   - Set production branch (typically `main` or `master`)
   - Optionally configure preview branches for testing

5. **Advanced settings (optional)**:
   - Set up custom domains
   - Configure access policies
   - Enable web analytics

After configuration, Cloudflare Pages will:
- Automatically build and deploy when code is pushed to the configured branches
- Provide unique preview URLs for each commit
- Enable rollbacks to previous deployments
- Provide analytics and performance monitoring

For repository-specific settings, you can also add a `cloudflare.toml` file to your repository:

```toml
# cloudflare.toml
[build]
  command = "cd frontend && npm ci && npm run build"
  publish = "frontend/build"
  node_version = "16"

[build.environment]
  REACT_APP_API_URL = "https://api.yourdomain.com"

[build.production]
  # Production-specific environment variables
  REACT_APP_ENVIRONMENT = "production"

[build.staging]
  # Staging-specific environment variables
  REACT_APP_ENVIRONMENT = "staging"
```

This configuration enables a fully automated CI/CD pipeline where:
1. Developers push code to GitHub
2. Cloudflare automatically detects the changes
3. The build process runs according to your configuration
4. The new version is deployed to Cloudflare's global network
5. Your site is served from edge locations worldwide for optimal performance

### 2. API Backend Deployment

#### Docker Deployment:

```bash
# Build the Docker image
cd api
docker build -t echelon-api .

# Run locally for testing
docker run -p 8000:8000 -v /path/to/config:/app/config echelon-api

# Deploy to cloud platform of choice (AWS ECS, GCP Cloud Run, etc.)
```

#### Direct Deployment:

```bash
# Install dependencies
pip install fastapi uvicorn gunicorn

# Run with Gunicorn
gunicorn api.app:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Local Deployment

For development or small-scale usage:

```bash
# Run the Flask dashboard
cd src
python -m dashboard.app

# Or run the FastAPI backend
cd api
uvicorn app:app --reload
```

---

This documentation provides a comprehensive overview of Echelon, but the system is highly customizable and can be extended to fit your specific needs. The modular design allows you to modify or replace components as required.

For technical support or contributions, please refer to the GitHub repository. 