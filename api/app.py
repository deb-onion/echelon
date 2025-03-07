#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Echelon API
----------

FastAPI backend for the Echelon Google Ads Management System.
Provides API endpoints for the frontend application.
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import setup_logging, micros_to_currency
from src.accounts.account_1.campaigns.retrieve_campaigns import CampaignRetriever
from src.bulk_operations.account_optimizer import AccountOptimizer

# Configure logging
log_dir = os.path.join(project_root, "logs")
logger = setup_logging(log_dir, None, logging.INFO, console_output=True)

# Initialize FastAPI app
app = FastAPI(
    title="Echelon API",
    description="API for Google Ads Management System with AI Optimization",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "https://echelon-ads.pages.dev",
    "https://echelon-ads.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
CONFIG_DIR = os.path.join(project_root, "config")
API_CLIENTS = {}  # Cache for API clients
OPTIMIZERS = {}   # Cache for optimizers

# Simple authentication (replace with proper auth in production)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic models for request/response
class AccountBase(BaseModel):
    account_id: str

class CampaignListResponse(BaseModel):
    campaigns: List[Dict[str, Any]]

class CampaignDetailResponse(BaseModel):
    details: Dict[str, Any]

class RecommendationsResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

class ApplyRecommendationsRequest(BaseModel):
    account_id: str
    campaigns: List[str]

class ApplyRecommendationsResponse(BaseModel):
    success: bool
    applied: int
    skipped: int
    details: List[Dict[str, Any]]

# Helper functions
def get_api_client(account_id: str) -> GoogleAdsApiClient:
    """Get or create an API client for an account"""
    if account_id in API_CLIENTS:
        return API_CLIENTS[account_id]
    
    # Create a new API client
    api_client = GoogleAdsApiClient(
        config_dir=CONFIG_DIR,
        account_id=account_id
    )
    
    # Cache the API client
    API_CLIENTS[account_id] = api_client
    
    return api_client

def get_optimizer(account_id: str) -> AccountOptimizer:
    """Get or create an account optimizer"""
    if account_id in OPTIMIZERS:
        return OPTIMIZERS[account_id]
    
    # Create a new optimizer
    optimizer = AccountOptimizer(
        account_id=account_id,
        config_dir=CONFIG_DIR,
        log_level="INFO"
    )
    
    # Cache the optimizer
    OPTIMIZERS[account_id] = optimizer
    
    return optimizer

# API Routes
@app.get("/accounts")
def list_accounts():
    """Get list of available accounts"""
    # In a real implementation, this would query your database or config
    # For now, we'll just return sample accounts
    return {
        "accounts": [
            {
                "account_id": "123-456-7890",
                "account_name": "Example Account"
            }
        ]
    }

@app.get("/auth/status")
def auth_status(token: str = Depends(oauth2_scheme)):
    """Check authentication status"""
    # In a real implementation, validate the token
    # For now, we'll just return a successful response
    return {
        "authenticated": True,
        "expires_at": (datetime.now() + timedelta(days=1)).isoformat()
    }

@app.get("/campaigns", response_model=CampaignListResponse)
def list_campaigns(account_id: str, status: Optional[str] = None):
    """Get list of campaigns for an account"""
    try:
        # Get API client
        api_client = get_api_client(account_id)
        
        # Create campaign retriever
        retriever = CampaignRetriever(
            api_client=api_client,
            config_dir=CONFIG_DIR
        )
        
        # Get campaign list
        status_filter = status.split(",") if status else ["ENABLED", "PAUSED"]
        campaigns = retriever.get_campaign_list(status_filter=status_filter)
        
        # Format campaigns for response
        formatted_campaigns = []
        for campaign_data in campaigns:
            campaign = campaign_data.get('campaign', {})
            metrics = campaign_data.get('metrics', {})
            
            # Format metrics
            budget_micros = campaign.get('budget', {}).get('amountMicros', 0)
            budget = micros_to_currency(budget_micros)
            
            cost_micros = metrics.get('costMicros', 0)
            cost = micros_to_currency(cost_micros)
            
            # Create summary
            formatted_campaigns.append({
                'id': campaign.get('id'),
                'name': campaign.get('name', 'Unknown'),
                'status': campaign.get('status', 'UNKNOWN'),
                'type': campaign.get('advertisingChannelType', 'UNKNOWN'),
                'budget': budget,
                'cost': cost,
                'impressions': int(metrics.get('impressions', 0)),
                'clicks': int(metrics.get('clicks', 0)),
                'conversions': float(metrics.get('conversions', 0))
            })
        
        return {"campaigns": formatted_campaigns}
    except Exception as e:
        logger.error(f"Error listing campaigns: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/campaigns/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign_details(campaign_id: str, account_id: str):
    """Get details for a specific campaign"""
    try:
        # Get API client
        api_client = get_api_client(account_id)
        
        # Create campaign retriever
        retriever = CampaignRetriever(
            api_client=api_client,
            config_dir=CONFIG_DIR
        )
        
        # Get campaign details
        details = retriever.get_campaign_details(campaign_id)
        
        return {"details": details}
    except Exception as e:
        logger.error(f"Error getting campaign details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/recommendations", response_model=RecommendationsResponse)
def get_account_recommendations(account_id: str):
    """Get account-wide recommendations"""
    try:
        # Get optimizer
        optimizer = get_optimizer(account_id)
        
        # Generate recommendations
        optimizer.generate_recommendations(include_paused=True)
        
        # Format data for response
        formatted_recommendations = []
        for campaign_id, campaign_rec in optimizer.recommendations.get('campaigns', {}).items():
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
            
            # Format for response
            formatted_recommendations.append({
                'campaign_id': campaign_id,
                'campaign_name': campaign_rec.get('campaign_name', f"Campaign {campaign_id}"),
                'health_score': campaign_rec.get('overall_health_score', 0),
                'bid_adjustment': bid_adj,
                'budget_adjustment': budget_adj,
                'improvement_count': len(campaign_rec.get('improvement_suggestions', [])),
                'has_recommendations': bool(campaign_rec.get('bid_adjustments') or 
                                          campaign_rec.get('budget_recommendation') or 
                                          campaign_rec.get('improvement_suggestions'))
            })
        
        return {"recommendations": formatted_recommendations}
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/recommendations/{campaign_id}")
def get_campaign_recommendations(campaign_id: str, account_id: str):
    """Get recommendations for a specific campaign"""
    try:
        # Get optimizer
        optimizer = get_optimizer(account_id)
        
        # Generate recommendations for this campaign only
        optimizer.generate_recommendations(campaign_id=campaign_id)
        
        # Get recommendations
        campaigns_recommendations = optimizer.recommendations.get('campaigns', {})
        recommendations = campaigns_recommendations.get(campaign_id, {})
        
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Error getting campaign recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/apply-recommendations", response_model=ApplyRecommendationsResponse)
def apply_recommendations(request: ApplyRecommendationsRequest):
    """Apply selected recommendations"""
    try:
        account_id = request.account_id
        campaign_ids = request.campaigns
        
        if not campaign_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No campaigns selected"
            )
        
        # Get optimizer
        optimizer = get_optimizer(account_id)
        
        # Initialize results
        results = {
            'applied': 0,
            'skipped': 0,
            'details': []
        }
        
        # Process each selected campaign
        for campaign_id in campaign_ids:
            try:
                # Get cached recommendations or generate new ones
                if not optimizer.recommendations or 'campaigns' not in optimizer.recommendations:
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
                    
            except Exception as e:
                logger.error(f"Error applying changes to campaign {campaign_id}: {e}")
                results['skipped'] += 1
                results['details'].append({
                    'campaign_id': campaign_id,
                    'status': 'error',
                    'message': str(e)
                })
        
        return {
            'success': True,
            **results
        }
    except Exception as e:
        logger.error(f"Error applying recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 