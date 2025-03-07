#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Echelon Dashboard
----------------

Web dashboard for visualizing campaign recommendations and
selectively applying optimization changes.
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from functools import wraps

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if project_root not in sys.path:
    sys.path.append(project_root)

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import setup_logging, micros_to_currency
from src.accounts.account_1.campaigns.retrieve_campaigns import CampaignRetriever
from src.bulk_operations.account_optimizer import AccountOptimizer

# Configure logging
log_dir = os.path.join(project_root, "logs")
logger = setup_logging(log_dir, None, logging.INFO, console_output=True)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'echelon-dashboard-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'

# Global variables
CONFIG_DIR = os.path.join(project_root, "config")
ACCOUNTS = {}  # Cache for account data
CAMPAIGNS = {}  # Cache for campaign data
RECOMMENDATIONS = {}  # Cache for recommendations

def requires_auth(f):
    """Simple decorator to check if an account is selected"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'account_id' not in session:
            flash('Please select an account first', 'warning')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated

def get_account_list() -> List[Dict[str, Any]]:
    """Get list of available accounts"""
    # In a real implementation, this would query your database or config
    # For now, we'll just return a sample account
    return [
        {
            'account_id': '123-456-7890',
            'account_name': 'Example Account'
        }
    ]

def get_api_client(account_id: str) -> GoogleAdsApiClient:
    """Get or create an API client for an account"""
    if account_id in ACCOUNTS:
        return ACCOUNTS[account_id]['api_client']
    
    # Create a new API client
    api_client = GoogleAdsApiClient(
        config_dir=CONFIG_DIR,
        account_id=account_id
    )
    
    # Cache the API client
    ACCOUNTS[account_id] = {
        'api_client': api_client,
        'last_updated': datetime.now()
    }
    
    return api_client

@app.route('/')
def index():
    """Home page - account selection"""
    accounts = get_account_list()
    return render_template('index.html', accounts=accounts)

@app.route('/select_account', methods=['POST'])
def select_account():
    """Select an account to work with"""
    account_id = request.form.get('account_id')
    if not account_id:
        flash('Please select a valid account', 'error')
        return redirect(url_for('index'))
    
    session['account_id'] = account_id
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
@requires_auth
def dashboard():
    """Main dashboard view"""
    account_id = session['account_id']
    
    # Get API client
    api_client = get_api_client(account_id)
    
    # Create campaign retriever
    retriever = CampaignRetriever(
        api_client=api_client,
        config_dir=CONFIG_DIR
    )
    
    # Get campaign list
    campaigns = retriever.get_campaign_list(status_filter=["ENABLED", "PAUSED"])
    
    # Extract summary data for display
    campaign_summary = []
    for campaign_data in campaigns:
        campaign = campaign_data.get('campaign', {})
        metrics = campaign_data.get('metrics', {})
        
        # Format metrics
        budget_micros = campaign.get('budget', {}).get('amountMicros', 0)
        budget = micros_to_currency(budget_micros)
        
        cost_micros = metrics.get('costMicros', 0)
        cost = micros_to_currency(cost_micros)
        
        impressions = int(metrics.get('impressions', 0))
        clicks = int(metrics.get('clicks', 0))
        conversions = float(metrics.get('conversions', 0))
        
        # Create summary
        campaign_summary.append({
            'id': campaign.get('id'),
            'name': campaign.get('name', 'Unknown'),
            'status': campaign.get('status', 'UNKNOWN'),
            'budget': budget,
            'cost': cost,
            'impressions': impressions,
            'clicks': clicks,
            'conversions': conversions
        })
    
    return render_template('dashboard.html', 
                          account_id=account_id,
                          campaigns=campaign_summary)

@app.route('/campaign/<campaign_id>')
@requires_auth
def campaign_details(campaign_id):
    """Campaign details page"""
    account_id = session['account_id']
    
    # Get API client
    api_client = get_api_client(account_id)
    
    # Create campaign retriever
    retriever = CampaignRetriever(
        api_client=api_client,
        config_dir=CONFIG_DIR
    )
    
    # Get campaign details
    details = retriever.get_campaign_details(campaign_id)
    
    # Get campaign recommendations
    if campaign_id not in RECOMMENDATIONS:
        # Get recommendations
        model_dir = os.path.join(project_root, "models", f"account_{account_id}")
        os.makedirs(model_dir, exist_ok=True)
        
        optimizer = AccountOptimizer(
            account_id=account_id,
            config_dir=CONFIG_DIR
        )
        
        # Generate recommendation for this campaign only
        optimizer.generate_recommendations(campaign_id=campaign_id)
        
        # Get recommendations
        campaigns_recommendations = optimizer.recommendations.get('campaigns', {})
        recommendations = campaigns_recommendations.get(campaign_id, {})
        
        # Cache recommendations
        RECOMMENDATIONS[campaign_id] = recommendations
    else:
        recommendations = RECOMMENDATIONS[campaign_id]
    
    return render_template('campaign_details.html',
                          account_id=account_id,
                          details=details,
                          recommendations=recommendations)

@app.route('/recommendations')
@requires_auth
def account_recommendations():
    """Account-wide recommendations page"""
    account_id = session['account_id']
    
    # Create account optimizer
    optimizer = AccountOptimizer(
        account_id=account_id,
        config_dir=CONFIG_DIR
    )
    
    # Generate recommendations
    optimizer.generate_recommendations(include_paused=True)
    
    # Get all recommendations
    recommendations = optimizer.recommendations
    
    # Format data for display
    formatted_recommendations = []
    for campaign_id, campaign_rec in recommendations.get('campaigns', {}).items():
        
        # Get bid adjustment
        bid_adj = "N/A"
        if campaign_rec.get('bid_adjustments'):
            adj_value = campaign_rec['bid_adjustments'].get('adjustment_percentage', 0)
            bid_adj = f"{adj_value:.1f}%"
        
        # Get budget adjustment
        budget_adj = "N/A"
        if campaign_rec.get('budget_recommendation'):
            adj_value = campaign_rec['budget_recommendation'].get('adjustment_percentage', 0)
            budget_adj = f"{adj_value:.1f}%"
        
        # Format for table
        formatted_recommendations.append({
            'campaign_id': campaign_id,
            'campaign_name': campaign_rec.get('campaign_name', f"Campaign {campaign_id}"),
            'health_score': campaign_rec.get('overall_health_score', 'N/A'),
            'bid_adjustment': bid_adj,
            'budget_adjustment': budget_adj,
            'improvement_count': len(campaign_rec.get('improvement_suggestions', [])),
            'has_recommendations': bool(campaign_rec.get('bid_adjustments') or 
                                      campaign_rec.get('budget_recommendation') or 
                                      campaign_rec.get('improvement_suggestions'))
        })
    
    return render_template('recommendations.html',
                          account_id=account_id,
                          recommendations=formatted_recommendations)

@app.route('/apply_recommendations', methods=['POST'])
@requires_auth
def apply_recommendations():
    """Apply selected recommendations"""
    account_id = session['account_id']
    data = request.json
    
    # Get selected recommendations
    selected_campaigns = data.get('campaigns', [])
    
    if not selected_campaigns:
        return jsonify({
            'success': False,
            'message': 'No campaigns selected'
        })
    
    # Initialize results
    results = {
        'applied': 0,
        'skipped': 0,
        'details': []
    }
    
    # Create optimizer
    optimizer = AccountOptimizer(
        account_id=account_id,
        config_dir=CONFIG_DIR
    )
    
    # Process each selected campaign
    for campaign_id in selected_campaigns:
        try:
            # Get cached recommendations or generate new ones
            if 'recommendations' not in optimizer.recommendations:
                optimizer.generate_recommendations(campaign_id=campaign_id)
            
            # Apply changes to this campaign
            optimization_result = optimizer.optimizer.optimize_campaign(
                campaign_id=campaign_id,
                apply_changes=True
            )
            
            # Update results
            changes_applied = optimization_result.get('changes_applied', False)
            if changes_applied:
                results['applied'] += 1
                status = 'applied'
            else:
                results['skipped'] += 1
                status = 'skipped'
                
            results['details'].append({
                'campaign_id': campaign_id,
                'status': status
            })
            
            # Clear cache for this campaign
            if campaign_id in RECOMMENDATIONS:
                del RECOMMENDATIONS[campaign_id]
                
        except Exception as e:
            logger.error(f"Error applying changes to campaign {campaign_id}: {e}")
            results['skipped'] += 1
            results['details'].append({
                'campaign_id': campaign_id,
                'status': 'error',
                'message': str(e)
            })
    
    return jsonify({
        'success': True,
        'results': results
    })

if __name__ == '__main__':
    # Check if templates directory exists
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    if not os.path.exists(templates_dir):
        print(f"Creating templates directory: {templates_dir}")
        os.makedirs(templates_dir, exist_ok=True)
    
    # Create static directory if it doesn't exist
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    if not os.path.exists(static_dir):
        print(f"Creating static directory: {static_dir}")
        os.makedirs(static_dir, exist_ok=True)
        
        # Create CSS directory
        css_dir = os.path.join(static_dir, 'css')
        os.makedirs(css_dir, exist_ok=True)
        
        # Create JS directory
        js_dir = os.path.join(static_dir, 'js')
        os.makedirs(js_dir, exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000) 