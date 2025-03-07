#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Account Optimizer
---------------

Tool for managing bulk optimizations across an account.
Allows viewing AI recommendations and selectively applying them.
"""

import os
import sys
import argparse
import logging
import json
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from tabulate import tabulate

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import setup_logging, load_json_config, save_json_config
from src.ai_engine.ai_optimizer import AICampaignOptimizer

# Configure logging
logger = logging.getLogger(__name__)

class AccountOptimizer:
    """
    Manages optimizations across an entire account
    with human review capabilities
    """
    
    def __init__(self, 
                account_id: str, 
                config_dir: str = "config",
                log_level: str = "INFO"):
        """
        Initialize the account optimizer
        
        Args:
            account_id: Google Ads account ID
            config_dir: Directory containing configuration files
            log_level: Logging level
        """
        self.account_id = account_id
        self.config_dir = config_dir
        
        # Set up logging
        log_dir = os.path.join("logs")
        self.logger = setup_logging(
            log_dir, 
            account_id, 
            getattr(logging, log_level),
            console_output=True
        )
        
        # Initialize API client
        self.api_client = GoogleAdsApiClient(
            config_dir=config_dir,
            account_id=account_id
        )
        
        # Initialize AI optimizer
        model_dir = os.path.join("models", f"account_{account_id}")
        os.makedirs(model_dir, exist_ok=True)
        
        self.optimizer = AICampaignOptimizer(
            self.api_client,
            model_dir=model_dir
        )
        
        # Store recommendations
        self.recommendations = {}
        
    def train_models(self, force_retrain: bool = False) -> Dict[str, bool]:
        """
        Train AI models for the account
        
        Args:
            force_retrain: Whether to force retraining of models
            
        Returns:
            Dictionary with training status for each model
        """
        self.logger.info("Training AI models for optimization")
        return self.optimizer.train_models(force_retrain=force_retrain)
    
    def get_campaign_list(self) -> List[Dict[str, Any]]:
        """
        Get list of campaigns in the account
        
        Returns:
            List of campaigns with their details
        """
        self.logger.info("Fetching campaign list")
        return self.api_client.get_campaign_list()
    
    def generate_recommendations(self, 
                               campaign_id: Optional[str] = None,
                               include_paused: bool = False) -> Dict[str, Any]:
        """
        Generate optimization recommendations for campaigns
        
        Args:
            campaign_id: Specific campaign ID (None for all campaigns)
            include_paused: Whether to include paused campaigns
            
        Returns:
            Dictionary with recommendations for each campaign
        """
        self.recommendations = {
            "account_id": self.account_id,
            "timestamp": datetime.now().isoformat(),
            "campaigns": {}
        }
        
        if campaign_id:
            # Generate recommendations for specific campaign
            self.logger.info(f"Generating recommendations for campaign {campaign_id}")
            recommendations = self.optimizer.get_campaign_recommendations(campaign_id)
            self.recommendations["campaigns"][campaign_id] = recommendations
        else:
            # Generate recommendations for all campaigns
            self.logger.info("Generating recommendations for all campaigns")
            
            # Get list of campaigns
            status_filter = ["ENABLED"]
            if include_paused:
                status_filter.append("PAUSED")
                
            campaign_list = self.api_client.get_campaign_list(status_filter=status_filter)
            
            if not campaign_list:
                self.logger.warning("No campaigns found")
                return self.recommendations
            
            # Generate recommendations for each campaign
            for campaign_data in campaign_list:
                campaign = campaign_data.get("campaign", {})
                campaign_id = campaign.get("id")
                campaign_name = campaign.get("name")
                
                if not campaign_id:
                    continue
                
                self.logger.info(f"Generating recommendations for campaign: {campaign_name}")
                recommendations = self.optimizer.get_campaign_recommendations(campaign_id)
                
                # Store recommendations with campaign name for better readability
                recommendations["campaign_name"] = campaign_name
                self.recommendations["campaigns"][campaign_id] = recommendations
        
        return self.recommendations
    
    def save_recommendations(self, filename: str) -> bool:
        """
        Save recommendations to a JSON file
        
        Args:
            filename: Path to save recommendations
            
        Returns:
            True if successful, False otherwise
        """
        if not self.recommendations:
            self.logger.warning("No recommendations to save")
            return False
        
        try:
            # Create directory if it doesn't exist
            output_dir = os.path.dirname(filename)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            
            with open(filename, "w") as f:
                json.dump(self.recommendations, f, indent=2)
                
            self.logger.info(f"Saved recommendations to {filename}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving recommendations: {e}")
            return False
    
    def load_recommendations(self, filename: str) -> bool:
        """
        Load recommendations from a JSON file
        
        Args:
            filename: Path to load recommendations from
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not os.path.exists(filename):
                self.logger.error(f"Recommendations file not found: {filename}")
                return False
            
            with open(filename, "r") as f:
                self.recommendations = json.load(f)
                
            self.logger.info(f"Loaded recommendations from {filename}")
            return True
        except Exception as e:
            self.logger.error(f"Error loading recommendations: {e}")
            return False
    
    def display_recommendations(self, campaign_id: Optional[str] = None) -> None:
        """
        Display recommendations in a tabular format
        
        Args:
            campaign_id: Specific campaign ID (None for all campaigns)
        """
        if not self.recommendations or not self.recommendations.get("campaigns"):
            print("No recommendations available. Run generate_recommendations() first.")
            return
        
        campaigns = self.recommendations["campaigns"]
        
        if campaign_id and campaign_id in campaigns:
            # Display recommendations for specific campaign
            self._display_campaign_recommendations(campaign_id, campaigns[campaign_id])
        else:
            # Display summary of all campaign recommendations
            self._display_all_campaign_recommendations(campaigns)
    
    def _display_campaign_recommendations(self, campaign_id: str, recommendations: Dict[str, Any]) -> None:
        """
        Display detailed recommendations for a specific campaign
        
        Args:
            campaign_id: Campaign ID
            recommendations: Recommendations for the campaign
        """
        campaign_name = recommendations.get("campaign_name", "Unknown Campaign")
        print(f"\nRecommendations for Campaign: {campaign_name} (ID: {campaign_id})")
        print("=" * 80)
        
        # Display overall health score
        health_score = recommendations.get("overall_health_score")
        if health_score is not None:
            health_status = "Excellent" if health_score > 80 else "Good" if health_score > 60 else "Fair" if health_score > 40 else "Poor"
            print(f"Overall Health Score: {health_score}/100 ({health_status})")
        
        # Display bid adjustments
        bid_adjustments = recommendations.get("bid_adjustments")
        if bid_adjustments:
            print("\nBid Adjustments:")
            print(f"  Current CPA: ${bid_adjustments.get('current_cpa', 0):.2f}")
            print(f"  Recommended CPA: ${bid_adjustments.get('recommended_cpa', 0):.2f}")
            print(f"  Adjustment: {bid_adjustments.get('adjustment_percentage', 0):.1f}%")
        
        # Display budget recommendations
        budget_rec = recommendations.get("budget_recommendation")
        if budget_rec:
            print("\nBudget Recommendation:")
            print(f"  Current Budget: ${budget_rec.get('current_budget', 0):.2f}")
            print(f"  Recommended Budget: ${budget_rec.get('recommended_budget', 0):.2f}")
            print(f"  Adjustment: {budget_rec.get('adjustment_percentage', 0):.1f}%")
        
        # Display performance forecast
        forecast = recommendations.get("performance_forecast")
        if forecast:
            print("\nPerformance Forecast:")
            print(f"  Current Conversions: {forecast.get('current_conversions', 0):.1f}")
            print(f"  Expected Conversions: {forecast.get('expected_conversions', 0):.1f}")
            print(f"  With 20% More Budget: {forecast.get('expected_conversions_with_20pct_more_budget', 0):.1f}")
        
        # Display improvement suggestions
        suggestions = recommendations.get("improvement_suggestions", [])
        if suggestions:
            print("\nImprovement Suggestions:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")
        
        print("\n")
    
    def _display_all_campaign_recommendations(self, campaigns: Dict[str, Dict[str, Any]]) -> None:
        """
        Display summary of recommendations for all campaigns
        
        Args:
            campaigns: Dictionary of campaign recommendations
        """
        data = []
        headers = ["Campaign", "Health Score", "Bid Adjustment", "Budget Adjustment", "Expected Conversions"]
        
        for campaign_id, recommendations in campaigns.items():
            campaign_name = recommendations.get("campaign_name", "Unknown")
            health_score = recommendations.get("overall_health_score", "N/A")
            
            bid_adj = "N/A"
            if recommendations.get("bid_adjustments"):
                bid_adj = f"{recommendations['bid_adjustments'].get('adjustment_percentage', 0):.1f}%"
            
            budget_adj = "N/A"
            if recommendations.get("budget_recommendation"):
                budget_adj = f"{recommendations['budget_recommendation'].get('adjustment_percentage', 0):.1f}%"
            
            expected_conv = "N/A"
            if recommendations.get("performance_forecast"):
                expected_conv = f"{recommendations['performance_forecast'].get('expected_conversions', 0):.1f}"
            
            data.append([campaign_name, health_score, bid_adj, budget_adj, expected_conv])
        
        print("\nCampaign Recommendations Summary:")
        print(tabulate(data, headers=headers, tablefmt="grid"))
        print(f"\nTotal Campaigns: {len(campaigns)}")
    
    def review_and_apply_changes(self, interactive: bool = True) -> Dict[str, Any]:
        """
        Review recommendations and selectively apply changes
        
        Args:
            interactive: Whether to prompt for confirmation interactively
            
        Returns:
            Dictionary with results of applied changes
        """
        if not self.recommendations or not self.recommendations.get("campaigns"):
            print("No recommendations available. Run generate_recommendations() first.")
            return {"applied": 0, "skipped": 0, "campaigns": []}
        
        campaigns = self.recommendations["campaigns"]
        results = {"applied": 0, "skipped": 0, "campaigns": []}
        
        for campaign_id, recommendations in campaigns.items():
            campaign_name = recommendations.get("campaign_name", "Unknown Campaign")
            
            # Display recommendations
            self._display_campaign_recommendations(campaign_id, recommendations)
            
            apply_changes = False
            if interactive:
                # Prompt for confirmation
                response = input(f"Apply changes to campaign '{campaign_name}'? (y/n): ").strip().lower()
                apply_changes = response in ("y", "yes")
            else:
                # Auto-apply based on criteria
                # Only apply if health score is below threshold and adjustments are significant
                health_score = recommendations.get("overall_health_score", 100)
                
                bid_adjustment = 0
                if recommendations.get("bid_adjustments"):
                    bid_adjustment = abs(recommendations["bid_adjustments"].get("adjustment_percentage", 0))
                
                budget_adjustment = 0
                if recommendations.get("budget_recommendation"):
                    budget_adjustment = abs(recommendations["budget_recommendation"].get("adjustment_percentage", 0))
                
                # Only apply significant changes to underperforming campaigns
                apply_changes = (health_score < 70 and (bid_adjustment > 10 or budget_adjustment > 10))
            
            campaign_result = {
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "changes_applied": False,
                "error": None
            }
            
            if apply_changes:
                try:
                    # Apply changes through optimizer
                    optimization_result = self.optimizer.optimize_campaign(
                        campaign_id=campaign_id,
                        apply_changes=True
                    )
                    
                    if optimization_result.get("changes_applied", False):
                        self.logger.info(f"Applied changes to campaign: {campaign_name}")
                        campaign_result["changes_applied"] = True
                        results["applied"] += 1
                    else:
                        self.logger.warning(f"No changes applied to campaign: {campaign_name}")
                        results["skipped"] += 1
                except Exception as e:
                    self.logger.error(f"Error applying changes to campaign {campaign_name}: {e}")
                    campaign_result["error"] = str(e)
                    results["skipped"] += 1
            else:
                self.logger.info(f"Skipped applying changes to campaign: {campaign_name}")
                results["skipped"] += 1
            
            results["campaigns"].append(campaign_result)
        
        return results

def main():
    """Command line interface for account optimization"""
    parser = argparse.ArgumentParser(description="Account Optimization Tool")
    
    # Account settings
    parser.add_argument("--account", "-a", type=str, required=True,
                     help="Account ID to optimize (format: XXX-XXX-XXXX)")
    
    # Action selection
    parser.add_argument("--action", choices=[
        "train", "recommend", "review", "apply"
    ], required=True, help="Action to perform")
    
    # Campaign selection
    parser.add_argument("--campaign", "-c", type=str,
                     help="Specific campaign ID (default: all campaigns)")
    parser.add_argument("--include-paused", action="store_true",
                     help="Include paused campaigns")
    
    # Output options
    parser.add_argument("--output", "-o", type=str,
                     help="Output file for recommendations (JSON format)")
    parser.add_argument("--input", "-i", type=str,
                     help="Input file with recommendations (JSON format)")
    
    # Execution settings
    parser.add_argument("--non-interactive", action="store_true",
                     help="Run without interactive prompts")
    parser.add_argument("--force-retrain", action="store_true",
                     help="Force retraining of AI models")
    parser.add_argument("--config-dir", type=str, default="config",
                     help="Directory containing configuration files")
    parser.add_argument("--log-level", type=str, 
                     choices=["DEBUG", "INFO", "WARNING", "ERROR"],
                     default="INFO", help="Logging level")
    
    args = parser.parse_args()
    
    # Create optimizer
    optimizer = AccountOptimizer(
        account_id=args.account,
        config_dir=args.config_dir,
        log_level=args.log_level
    )
    
    # Execute requested action
    if args.action == "train":
        # Train models
        results = optimizer.train_models(force_retrain=args.force_retrain)
        print("\nModel Training Results:")
        for model, success in results.items():
            print(f"  {model}: {'Success' if success else 'Failed'}")
    
    elif args.action == "recommend":
        # Generate recommendations
        optimizer.generate_recommendations(
            campaign_id=args.campaign,
            include_paused=args.include_paused
        )
        
        # Display recommendations
        optimizer.display_recommendations(args.campaign)
        
        # Save recommendations if output file specified
        if args.output:
            optimizer.save_recommendations(args.output)
    
    elif args.action == "review":
        # Load recommendations if input file specified
        if args.input:
            optimizer.load_recommendations(args.input)
        else:
            # Generate recommendations
            optimizer.generate_recommendations(
                campaign_id=args.campaign,
                include_paused=args.include_paused
            )
        
        # Display recommendations
        optimizer.display_recommendations(args.campaign)
    
    elif args.action == "apply":
        # Load recommendations if input file specified
        if args.input:
            optimizer.load_recommendations(args.input)
        else:
            # Generate recommendations
            optimizer.generate_recommendations(
                campaign_id=args.campaign,
                include_paused=args.include_paused
            )
        
        # Review and apply changes
        results = optimizer.review_and_apply_changes(
            interactive=not args.non_interactive
        )
        
        print("\nApplied Changes Summary:")
        print(f"  Changes Applied: {results['applied']}")
        print(f"  Changes Skipped: {results['skipped']}")
        print(f"  Total Campaigns: {len(results['campaigns'])}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 