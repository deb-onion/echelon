#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Retrieve Campaigns
-----------------

Module for retrieving existing campaigns from a Google Ads account
and applying optimization workflows to them.
"""

import os
import sys
import argparse
import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import setup_logging, micros_to_currency, load_json_config
from src.core.request_handler import with_retry
from src.ai_engine.ai_optimizer import AICampaignOptimizer
from src.bulk_operations.account_optimizer import AccountOptimizer

# Configure logger
logger = logging.getLogger(__name__)

class CampaignRetriever:
    """
    Retrieves and manages existing campaigns from a Google Ads account
    """
    
    def __init__(self, api_client: GoogleAdsApiClient, config_dir: str):
        """
        Initialize the campaign retriever
        
        Args:
            api_client: Google Ads API client
            config_dir: Directory with configuration files
        """
        self.api_client = api_client
        self.config_dir = config_dir
        
        # Get account settings if available
        account_id = api_client.account_id.replace("-", "")
        settings_path = os.path.join("src", "accounts", f"account_{account_id}", "settings.json")
        self.settings = load_json_config(settings_path) if os.path.exists(settings_path) else {}
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def get_campaign_list(self, status_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get list of campaigns in the account
        
        Args:
            status_filter: Optional list of campaign statuses to filter by
                          (e.g., ["ENABLED", "PAUSED"])
            
        Returns:
            List of campaign data dictionaries
        """
        logger.info("Retrieving campaigns from account")
        return self.api_client.get_campaign_list(status_filter=status_filter)
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def get_campaign_details(self, campaign_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific campaign
        
        Args:
            campaign_id: ID of the campaign
            
        Returns:
            Dictionary with campaign details
        """
        logger.info(f"Retrieving details for campaign {campaign_id}")
        
        query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign.target_roas.target_roas,
          campaign.target_cpa.target_cpa_micros,
          campaign.budget.amount_micros,
          campaign.start_date,
          campaign.end_date,
          campaign.optimization_score,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.average_cpc,
          metrics.ctr,
          metrics.conversion_rate,
          campaign_criterion.location.geo_target_constant,
          campaign_criterion.language.language_constant
        FROM campaign
        LEFT JOIN campaign_criterion ON campaign.id = campaign_criterion.campaign
        WHERE campaign.id = {campaign_id}
        LIMIT 1000
        """
        
        results = self.api_client.execute_query(query)
        if not results:
            logger.warning(f"No data found for campaign {campaign_id}")
            return {}
        
        # Process results
        campaign_data = results[0]
        
        # Extract location and language targets from all results
        geo_targets = []
        language_targets = []
        
        for result in results:
            criterion = result.get('campaignCriterion', {})
            if criterion.get('location', {}).get('geoTargetConstant'):
                geo_id = criterion['location']['geoTargetConstant'].split('/')[-1]
                if geo_id not in [g.get('id') for g in geo_targets]:
                    geo_targets.append({
                        'id': geo_id,
                        'type': 'LOCATION'
                    })
            
            if criterion.get('language', {}).get('languageConstant'):
                lang_id = criterion['language']['languageConstant'].split('/')[-1]
                if lang_id not in language_targets:
                    language_targets.append(lang_id)
        
        # Get ad groups for this campaign
        ad_groups = self.get_ad_groups_for_campaign(campaign_id)
        
        # Combine all data
        return {
            'campaign': campaign_data.get('campaign', {}),
            'metrics': campaign_data.get('metrics', {}),
            'geo_targets': geo_targets,
            'language_targets': language_targets,
            'ad_groups': ad_groups
        }
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def get_ad_groups_for_campaign(self, campaign_id: str) -> List[Dict[str, Any]]:
        """
        Get ad groups for a specific campaign
        
        Args:
            campaign_id: ID of the campaign
            
        Returns:
            List of ad group dictionaries
        """
        query = f"""
        SELECT
          ad_group.id,
          ad_group.name,
          ad_group.status,
          ad_group.type,
          ad_group.cpc_bid_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM ad_group
        WHERE ad_group.campaign = '{self.api_client.get_resource_name('campaign', campaign_id)}'
        ORDER BY ad_group.id
        """
        
        results = self.api_client.execute_query(query)
        
        ad_groups = []
        for result in results:
            ad_groups.append({
                'ad_group': result.get('adGroup', {}),
                'metrics': result.get('metrics', {})
            })
        
        return ad_groups
    
    def display_campaign_summary(self, campaigns: List[Dict[str, Any]]) -> None:
        """
        Display a summary of campaigns in a tabular format
        
        Args:
            campaigns: List of campaign data dictionaries
        """
        if not campaigns:
            print("No campaigns found")
            return
        
        # Print header
        print("\nCAMPAIGN SUMMARY")
        print("=" * 100)
        print("{:<40} {:<15} {:<15} {:<10} {:<10} {:<10}".format(
            "Campaign Name", "Status", "Budget", "Clicks", "Conversions", "Cost"
        ))
        print("-" * 100)
        
        # Print campaign data
        for campaign_data in campaigns:
            campaign = campaign_data.get('campaign', {})
            metrics = campaign_data.get('metrics', {})
            
            name = campaign.get('name', 'Unknown')
            status = campaign.get('status', 'UNKNOWN')
            
            # Format budget
            budget_micros = campaign.get('budget', {}).get('amountMicros', 0)
            budget = f"${micros_to_currency(budget_micros):.2f}"
            
            # Format metrics
            clicks = int(metrics.get('clicks', 0))
            conversions = float(metrics.get('conversions', 0))
            cost_micros = metrics.get('costMicros', 0)
            cost = f"${micros_to_currency(cost_micros):.2f}"
            
            print("{:<40} {:<15} {:<15} {:<10} {:<10.1f} {:<10}".format(
                name[:38] + ".." if len(name) > 40 else name,
                status,
                budget,
                clicks,
                conversions,
                cost
            ))
        
        print("=" * 100)
        print(f"Total Campaigns: {len(campaigns)}")
    
    def display_campaign_details(self, campaign_details: Dict[str, Any]) -> None:
        """
        Display detailed information about a campaign
        
        Args:
            campaign_details: Dictionary with campaign details
        """
        if not campaign_details:
            print("No campaign details available")
            return
        
        campaign = campaign_details.get('campaign', {})
        metrics = campaign_details.get('metrics', {})
        ad_groups = campaign_details.get('ad_groups', [])
        
        print("\nCAMPAIGN DETAILS")
        print("=" * 100)
        
        # Basic information
        print(f"Name: {campaign.get('name', 'Unknown')}")
        print(f"ID: {campaign.get('id', 'Unknown')}")
        print(f"Status: {campaign.get('status', 'Unknown')}")
        print(f"Type: {campaign.get('advertisingChannelType', 'Unknown')}")
        
        # Budget
        budget_micros = campaign.get('budget', {}).get('amountMicros', 0)
        print(f"Daily Budget: ${micros_to_currency(budget_micros):.2f}")
        
        # Bidding
        bidding_strategy = campaign.get('biddingStrategyType', 'Unknown')
        print(f"Bidding Strategy: {bidding_strategy}")
        
        if campaign.get('targetRoas', {}).get('targetRoas'):
            print(f"Target ROAS: {campaign['targetRoas']['targetRoas']:.2f}")
        
        if campaign.get('targetCpa', {}).get('targetCpaMicros'):
            target_cpa = micros_to_currency(campaign['targetCpa']['targetCpaMicros'])
            print(f"Target CPA: ${target_cpa:.2f}")
        
        # Dates
        print(f"Start Date: {campaign.get('startDate', 'Unknown')}")
        if campaign.get('endDate'):
            print(f"End Date: {campaign.get('endDate')}")
        
        # Performance metrics
        print("\nPERFORMANCE METRICS")
        print("-" * 100)
        
        clicks = int(metrics.get('clicks', 0))
        impressions = int(metrics.get('impressions', 0))
        ctr = float(metrics.get('ctr', 0)) * 100  # Convert to percentage
        
        cost_micros = metrics.get('costMicros', 0)
        cost = micros_to_currency(cost_micros)
        
        conversions = float(metrics.get('conversions', 0))
        conversion_rate = float(metrics.get('conversionRate', 0)) * 100  # Convert to percentage
        
        avg_cpc = micros_to_currency(metrics.get('averageCpc', 0))
        
        conv_value = float(metrics.get('conversionsValue', 0))
        roas = conv_value / cost if cost > 0 else 0
        
        print(f"Impressions: {impressions:,}")
        print(f"Clicks: {clicks:,}")
        print(f"CTR: {ctr:.2f}%")
        print(f"Cost: ${cost:.2f}")
        print(f"Average CPC: ${avg_cpc:.2f}")
        print(f"Conversions: {conversions:.1f}")
        print(f"Conversion Rate: {conversion_rate:.2f}%")
        print(f"Conversion Value: ${conv_value:.2f}")
        print(f"ROAS: {roas:.2f}")
        
        # Optimization score
        if campaign.get('optimizationScore'):
            opt_score = float(campaign['optimizationScore']) * 100
            print(f"Google Optimization Score: {opt_score:.1f}%")
        
        # Ad groups
        if ad_groups:
            print("\nAD GROUPS")
            print("-" * 100)
            print("{:<30} {:<15} {:<15} {:<10} {:<10}".format(
                "Ad Group Name", "Status", "Bid", "Clicks", "Conversions"
            ))
            print("-" * 100)
            
            for ad_group_data in ad_groups:
                ad_group = ad_group_data.get('ad_group', {})
                ad_metrics = ad_group_data.get('metrics', {})
                
                name = ad_group.get('name', 'Unknown')
                status = ad_group.get('status', 'UNKNOWN')
                
                # Format bid
                bid_micros = ad_group.get('cpcBidMicros', 0)
                bid = f"${micros_to_currency(bid_micros):.2f}" if bid_micros else "Auto"
                
                # Format metrics
                ad_clicks = int(ad_metrics.get('clicks', 0))
                ad_conversions = float(ad_metrics.get('conversions', 0))
                
                print("{:<30} {:<15} {:<15} {:<10} {:<10.1f}".format(
                    name[:28] + ".." if len(name) > 30 else name,
                    status,
                    bid,
                    ad_clicks,
                    ad_conversions
                ))
        
        print("=" * 100)
    
    def optimize_campaign(self, campaign_id: str, apply_changes: bool = False) -> Dict[str, Any]:
        """
        Apply AI optimization to a specific campaign
        
        Args:
            campaign_id: ID of the campaign to optimize
            apply_changes: Whether to apply the changes automatically
            
        Returns:
            Dictionary with optimization results
        """
        logger.info(f"Optimizing campaign {campaign_id}")
        
        # Initialize AI optimizer
        model_dir = os.path.join("models", f"account_{self.api_client.account_id}")
        os.makedirs(model_dir, exist_ok=True)
        
        optimizer = AICampaignOptimizer(
            api_client=self.api_client,
            model_dir=model_dir
        )
        
        # Get optimization recommendations
        recommendations = optimizer.get_campaign_recommendations(campaign_id)
        
        # Display recommendations
        self._display_campaign_recommendations(campaign_id, recommendations)
        
        # Apply changes if requested
        result = {
            'campaign_id': campaign_id,
            'recommendations': recommendations,
            'changes_applied': False
        }
        
        if apply_changes:
            # Apply the changes
            optimization_result = optimizer.optimize_campaign(
                campaign_id=campaign_id,
                apply_changes=True
            )
            
            result['changes_applied'] = optimization_result.get('changes_applied', False)
            if result['changes_applied']:
                logger.info(f"Applied optimization changes to campaign {campaign_id}")
            else:
                logger.warning(f"No changes applied to campaign {campaign_id}")
        
        return result
    
    def _display_campaign_recommendations(self, campaign_id: str, recommendations: Dict[str, Any]) -> None:
        """
        Display optimization recommendations for a campaign
        
        Args:
            campaign_id: Campaign ID
            recommendations: Optimization recommendations
        """
        campaign_name = recommendations.get('campaign_name', f"Campaign {campaign_id}")
        
        print(f"\nOPTIMIZATION RECOMMENDATIONS FOR: {campaign_name}")
        print("=" * 100)
        
        # Display overall health score
        health_score = recommendations.get('overall_health_score')
        if health_score is not None:
            health_status = "Excellent" if health_score > 80 else "Good" if health_score > 60 else "Fair" if health_score > 40 else "Poor"
            print(f"Overall Health Score: {health_score}/100 ({health_status})")
        
        # Display bid adjustments
        bid_adjustments = recommendations.get('bid_adjustments')
        if bid_adjustments:
            print("\nBID ADJUSTMENTS:")
            print(f"  Current CPA: ${bid_adjustments.get('current_cpa', 0):.2f}")
            print(f"  Recommended CPA: ${bid_adjustments.get('recommended_cpa', 0):.2f}")
            print(f"  Adjustment: {bid_adjustments.get('adjustment_percentage', 0):.1f}%")
        
        # Display budget recommendations
        budget_rec = recommendations.get('budget_recommendation')
        if budget_rec:
            print("\nBUDGET RECOMMENDATION:")
            print(f"  Current Budget: ${budget_rec.get('current_budget', 0):.2f}")
            print(f"  Recommended Budget: ${budget_rec.get('recommended_budget', 0):.2f}")
            print(f"  Adjustment: {budget_rec.get('adjustment_percentage', 0):.1f}%")
        
        # Display performance forecast
        forecast = recommendations.get('performance_forecast')
        if forecast:
            print("\nPERFORMANCE FORECAST:")
            print(f"  Current Conversions: {forecast.get('current_conversions', 0):.1f}")
            print(f"  Expected Conversions: {forecast.get('expected_conversions', 0):.1f}")
            print(f"  With 20% More Budget: {forecast.get('expected_conversions_with_20pct_more_budget', 0):.1f}")
        
        # Display improvement suggestions
        suggestions = recommendations.get('improvement_suggestions', [])
        if suggestions:
            print("\nIMPROVEMENT SUGGESTIONS:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")
        
        print("=" * 100)

def main():
    """Command line interface for retrieving and optimizing campaigns"""
    parser = argparse.ArgumentParser(
        description="Retrieve and optimize existing campaigns in a Google Ads account"
    )
    
    # Account settings
    parser.add_argument(
        "--account", "-a",
        type=str,
        required=True,
        help="Account ID (format: XXX-XXX-XXXX)"
    )
    
    # Action selection
    parser.add_argument(
        "--action",
        choices=["list", "details", "optimize", "optimize-all"],
        default="list",
        help="Action to perform"
    )
    
    # Campaign selection
    parser.add_argument(
        "--campaign", "-c",
        type=str,
        help="Specific campaign ID (required for details and optimize actions)"
    )
    
    parser.add_argument(
        "--status",
        nargs="+",
        choices=["ENABLED", "PAUSED", "REMOVED"],
        default=["ENABLED"],
        help="Campaign status filter (default: ENABLED)"
    )
    
    parser.add_argument(
        "--apply-changes",
        action="store_true",
        help="Apply optimization changes (use with caution)"
    )
    
    # Output settings
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Save results to JSON file"
    )
    
    parser.add_argument(
        "--config-dir",
        type=str,
        default="config",
        help="Directory containing configuration files"
    )
    
    parser.add_argument(
        "--log-level",
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level"
    )
    
    args = parser.parse_args()
    
    # Set up logging
    log_dir = os.path.join("logs")
    logger = setup_logging(
        log_dir,
        args.account,
        getattr(logging, args.log_level),
        console_output=True
    )
    
    # Initialize API client
    api_client = GoogleAdsApiClient(
        config_dir=args.config_dir,
        account_id=args.account
    )
    
    # Create campaign retriever
    retriever = CampaignRetriever(
        api_client=api_client,
        config_dir=args.config_dir
    )
    
    try:
        if args.action == "list":
            # List all campaigns
            campaigns = retriever.get_campaign_list(status_filter=args.status)
            retriever.display_campaign_summary(campaigns)
            
            # Save results if requested
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(campaigns, f, indent=2)
                logger.info(f"Saved campaign list to {args.output}")
                
        elif args.action == "details":
            # Check if campaign ID is provided
            if not args.campaign:
                logger.error("Campaign ID is required for details action")
                return 1
                
            # Get campaign details
            details = retriever.get_campaign_details(args.campaign)
            retriever.display_campaign_details(details)
            
            # Save results if requested
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(details, f, indent=2)
                logger.info(f"Saved campaign details to {args.output}")
                
        elif args.action == "optimize":
            # Check if campaign ID is provided
            if not args.campaign:
                logger.error("Campaign ID is required for optimize action")
                return 1
                
            # Optimize the campaign
            result = retriever.optimize_campaign(
                campaign_id=args.campaign,
                apply_changes=args.apply_changes
            )
            
            # Save results if requested
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                logger.info(f"Saved optimization results to {args.output}")
                
        elif args.action == "optimize-all":
            # Use the account optimizer for bulk optimization
            account_optimizer = AccountOptimizer(
                account_id=args.account,
                config_dir=args.config_dir,
                log_level=args.log_level
            )
            
            # Generate recommendations for all campaigns
            account_optimizer.generate_recommendations(include_paused="PAUSED" in args.status)
            
            # Display recommendations
            account_optimizer.display_recommendations()
            
            # Apply changes if requested (with interactive confirmation)
            if args.apply_changes:
                results = account_optimizer.review_and_apply_changes(interactive=True)
                print(f"\nChanges applied: {results['applied']}")
                print(f"Changes skipped: {results['skipped']}")
            
            # Save results if requested
            if args.output:
                account_optimizer.save_recommendations(args.output)
                logger.info(f"Saved optimization results to {args.output}")
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 