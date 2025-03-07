# Echelon - Google Ads Management System

Echelon is a comprehensive Google Ads management system with AI-powered optimization capabilities. It provides a structured, account-isolated approach to managing multiple Google Ads accounts with advanced automation features.

## Features

- **Fully Independent Account Management**: Each account operates in isolation with dedicated resources
- **AI-Powered Optimization Engine**: Machine learning models for bid optimization, budget allocation, and performance forecasting
- **Campaign Management**: Create and manage Search, Display, Video, Shopping, and Performance Max campaigns
- **Budget Management**: AI-based budget allocation and real-time spend tracking
- **Alerting System**: Automated alerts for budget, performance, and anomaly detection
- **Reporting & Analytics**: Comprehensive reporting with Looker Studio integration
- **Multi-Account Monitoring**: Centralized view of all accounts with MCC dashboard

## Project Structure

The project follows a modular structure:

```
📂 /
│── 📂 src/                                      # Main source code
│   │── 📂 core/                                 # Core functionalities
│   │   │── 📜 authentication.py                 # Handles OAuth authentication
│   │   │── 📜 api_client.py                     # Google Ads API client
│   │   │── 📜 request_handler.py                # Handles API calls, rate limiting
│   │   │── 📜 utilities.py                      # Common utilities (logging, validation)
│   │── 📂 ai_engine/                            # AI-Powered Optimization Engine
│   │   │── 📜 ai_optimizer.py                   # AI suggests campaign improvements
│   │   │── 📜 ai_bid_adjuster.py                # AI-driven bid optimizations
│   │   │── 📜 ai_audience_refinement.py         # AI improves audience targeting
│   │   │── 📜 ai_anomaly_detector.py            # Detects spend anomalies
│   │   │── 📜 ai_keyword_optimizer.py           # AI refines keyword strategy
│   │   │── 📜 ai_performance_forecaster.py      # Predicts future campaign performance
│   │── 📂 accounts/                             # Fully independent account management
│   │   │── 📂 account_1/ (Fully isolated)
│   │   │   │── 📂 campaigns/                    # Campaign management (account 1)
│   │   │   │   │── 📜 create_search_campaign.py     # Create Search Campaign
│   │   │   │   │── 📜 create_display_campaign.py    # Create Display Campaign
│   │   │   │   │── 📜 create_video_campaign.py      # Create Video Campaign
│   │   │   │   │── 📜 create_shopping_campaign.py   # Create Shopping Campaign
│   │   │   │   │── 📜 create_pmax_campaign.py       # Create Performance Max Campaign
│   │   │   │   │── 📜 update_campaign.py            # Update existing campaigns
│   │   │   │   │── 📜 delete_campaign.py            # Delete campaigns
│   │   │   │   │── 📜 publish_campaign.py           # Publish campaigns
│   │   │   │── 📂 budget/                       # Budget management (account 1)
│   │   │   │   │── 📜 allocate_budget.py        # AI-based budget allocation
│   │   │   │   │── 📜 track_spending.py         # Track real-time ad spend
│   │   │   │── 📂 optimization/                 # AI-driven campaign optimization
│   │   │   │   │── 📜 ai_optimizer.py           # AI-based optimization engine
│   │   │   │── 📂 alerts/                       # AI-powered alerts & notifications
│   │   │   │   │── 📜 email_alerts.py           # Send email alerts (budget/campaign updates)
│   │   │   │   │── 📜 slack_alerts.py           # Send Slack alerts
│   │   │   │   │── 📜 anomaly_detector.py       # Detect ad spend anomalies
│   │   │   │── 📂 reports/                      # Reporting & analytics (account 1)
│   │   │   │   │── 📜 fetch_performance.py      # Fetch performance reports
│   │   │   │   │── 📜 generate_dashboard.py     # Generate visual dashboard
│   │   │   │── 📜 settings.json                 # Account 1-specific settings
│   │   │── 📂 account_2/ to account_10/         # Same structure for other accounts
│   │── 📂 bulk_operations/                      # ONLY used when modifying 2+ accounts
│   │── 📂 multi_account_monitoring/             # Centralized AI-powered view of all accounts
│   │── 📂 looker_studio_dashboard/              # Google Looker Studio Integration
│── 📂 config/                                   # Configuration files
│── 📂 logs/                                     # Logging & Debugging
│── 📂 ci_cd/                                    # Continuous Integration & Deployment
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/echelon.git
   cd echelon
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv env
   # On Windows
   env\Scripts\activate
   # On macOS/Linux
   source env/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Configure Google Ads API credentials:
   - Edit `config/google-ads.yaml` with your credentials
   - Obtain OAuth credentials from Google Cloud Console
   - Set up a developer token in your Google Ads account

## Configuration

1. **Google Ads API Credentials**: 
   - Add your credentials to `config/google-ads.yaml`
   - Follow the [Google Ads API documentation](https://developers.google.com/google-ads/api/docs/oauth/overview) for authentication setup

2. **Account Settings**:
   - Configure account-specific settings in `src/accounts/account_X/settings.json`
   - Each account operates independently with its own configuration

3. **AI Model Settings**:
   - Model parameters can be adjusted in the AI engine configuration files

## Usage

### Account Management

To create a search campaign for account 1:

```python
from src.core.api_client import GoogleAdsApiClient
from src.accounts.account_1.campaigns.create_search_campaign import SearchCampaignCreator

# Initialize API client
api_client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")

# Create campaign creator
creator = SearchCampaignCreator(api_client, config_dir="config")

# Create a search campaign
campaign_id = creator.create_campaign(
    campaign_name="My Test Campaign",
    budget_amount=100.0,
    bidding_strategy="MAXIMIZE_CONVERSIONS",
    status="PAUSED"
)

print(f"Created campaign ID: {campaign_id}")
```

### AI Optimization

To generate optimization recommendations:

```python
from src.core.api_client import GoogleAdsApiClient
from src.ai_engine.ai_optimizer import AICampaignOptimizer

# Initialize API client
api_client = GoogleAdsApiClient(config_dir="config", account_id="123-456-7890")

# Create AI optimizer
optimizer = AICampaignOptimizer(api_client, model_dir="models")

# Get recommendations for a campaign
recommendations = optimizer.get_campaign_recommendations(campaign_id="1234567890")

print(recommendations)
```

## Development

### Adding a New Account

1. Create a new account directory structure:
   ```
   mkdir -p src/accounts/account_X/{campaigns,budget,optimization,alerts,reports}
   mkdir -p logs/account_X
   ```

2. Create account settings file:
   ```
   touch src/accounts/account_X/settings.json
   ```

3. Update the account with your specific configuration

### Running Tests

Run the test suite with:

```
python -m unittest discover tests
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please open an issue in the GitHub repository.

## Deployment

### Frontend Deployment with Cloudflare Pages

Echelon's frontend can be deployed using Cloudflare Pages with GitHub integration for continuous deployment:

#### Setting Up GitHub Integration with Cloudflare Pages

1. **Push your repository to GitHub**
   ```bash
   # If not already done
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/echelon.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Log in to your Cloudflare account
   - Go to Pages > Create a project
   - Select "Connect to Git"
   - Authorize Cloudflare to access your GitHub repositories
   - Select your Echelon repository

3. **Configure Build Settings**
   - Build command: `cd frontend && npm ci && npm run build`
   - Build output directory: `frontend/build`
   - Add environment variables:
     - `NODE_VERSION`: `16`
     - `REACT_APP_API_URL`: Your API endpoint URL

4. **Set Up GitHub Actions (Alternative Method)**
   - The repository includes a GitHub Actions workflow in `ci_cd/cloudflare_pages.yml`
   - Add the following secrets to your GitHub repository:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - The workflow will automatically deploy changes to the frontend when you push to the main branch

### Backend Deployment

The API backend can be deployed using Docker:

```bash
# Build the Docker image
cd api
docker build -t echelon-api .

# Run locally for testing
docker run -p 8000:8000 -v /path/to/config:/app/config echelon-api
```

Or using the included GitHub Actions workflow that deploys to Google Cloud Run. 