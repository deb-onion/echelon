#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Optimization Runner
-----------------

Command line tool to run AI optimizations across accounts.
Can be used manually or scheduled through cron jobs.
"""

import os
import sys
import argparse
import logging
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import setup_logging, load_json_config, save_json_config
from src.ai_engine.ai_optimizer import AICampaignOptimizer

# Configure logging
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Run AI optimizations on Google Ads accounts")
    
    # Account selection
    parser.add_argument("--account", "-a", type=str, 
                      help="Specific account ID to optimize (format: XXX-XXX-XXXX)")
    parser.add_argument("--all-accounts", action="store_true", 
                      help="Run optimization for all configured accounts")
    
    # Optimization settings
    parser.add_argument("--campaign", "-c", type=str, 
                      help="Specific campaign ID to optimize")
    parser.add_argument("--apply-changes", action="store_true", 
                      help="Automatically apply the recommended changes")
    parser.add_argument("--force-retrain", action="store_true", 
                      help="Force retraining of AI models")
    
    # Execution settings
    parser.add_argument("--dry-run", action="store_true", 
                      help="Dry run: just list recommendations without saving or applying")
    parser.add_argument("--output", "-o", type=str, 
                      help="Output file for recommendations in JSON format")
    parser.add_argument("--config-dir", type=str, default="config",
                      help="Directory containing configuration files")
    parser.add_argument("--log-level", type=str, choices=["DEBUG", "INFO", "WARNING", "ERROR"], 
                      default="INFO", help="Logging level")
    
    return parser.parse_args()

def get_account_list(config_dir: str) -> List[str]:
    """
    Get list of configured accounts
    
    Args:
        config_dir: Directory containing configuration files
        
    Returns:
        List of account IDs
    """
    # Look for accounts in the src/accounts directory
    accounts_dir = os.path.join("src", "accounts")
    if not os.path.exists(accounts_dir):
        logger.error(f"Accounts directory not found: {accounts_dir}")
        return []
    
    # Find all account_X directories
    account_dirs = [d for d in os.listdir(accounts_dir) 
                  if os.path.isdir(os.path.join(accounts_dir, d)) and d.startswith("account_")]
    
    accounts = []
    for account_dir in account_dirs:
        # Check if settings.json exists
        settings_path = os.path.join(accounts_dir, account_dir, "settings.json")
        if os.path.exists(settings_path):
            settings = load_json_config(settings_path)
            if "account_id" in settings:
                accounts.append(settings["account_id"])
    
    return accounts

def optimize_account(account_id: str, args, config_dir: str) -> Dict[str, Any]:
    """
    Run optimization for a single account
    
    Args:
        account_id: Account ID to optimize
        args: Command line arguments
        config_dir: Directory containing configuration files
        
    Returns:
        Dictionary with optimization results
    """
    log_dir = os.path.join("logs")
    setup_logging(log_dir, account_id, 
                getattr(logging, args.log_level), 
                console_output=True)
    
    logger.info(f"Starting optimization for account {account_id}")
    
    # Initialize API client
    api_client = GoogleAdsApiClient(config_dir=config_dir, account_id=account_id)
    
    # Initialize AI optimizer
    model_dir = os.path.join("models", f"account_{account_id}")
    os.makedirs(model_dir, exist_ok=True)
    
    optimizer = AICampaignOptimizer(api_client, model_dir=model_dir)
    
    results = {
        "account_id": account_id,
        "timestamp": datetime.now().isoformat(),
        "model_training": None,
        "campaigns": []
    }
    
    # Train models if needed or requested
    if args.force_retrain:
        logger.info("Forcing model retraining")
        training_results = optimizer.train_models(force_retrain=True)
        results["model_training"] = training_results
    
    # If specific campaign ID is provided, only optimize that campaign
    if args.campaign:
        logger.info(f"Optimizing specific campaign: {args.campaign}")
        campaign_results = optimizer.optimize_campaign(
            campaign_id=args.campaign,
            apply_changes=args.apply_changes and not args.dry_run
        )
        results["campaigns"].append(campaign_results)
    else:
        # Get list of campaigns to optimize
        logger.info("Fetching campaign list")
        campaign_list = api_client.get_campaign_list(status_filter=["ENABLED"])
        
        if not campaign_list:
            logger.warning(f"No active campaigns found for account {account_id}")
            return results
        
        logger.info(f"Found {len(campaign_list)} active campaigns")
        
        # Optimize each campaign
        for campaign_data in campaign_list:
            campaign = campaign_data.get("campaign", {})
            campaign_id = campaign.get("id")
            campaign_name = campaign.get("name")
            
            if not campaign_id:
                continue
                
            logger.info(f"Optimizing campaign: {campaign_name} (ID: {campaign_id})")
            
            campaign_results = optimizer.optimize_campaign(
                campaign_id=campaign_id,
                apply_changes=args.apply_changes and not args.dry_run
            )
            results["campaigns"].append(campaign_results)
    
    # Save results if output file is specified
    if args.output and not args.dry_run:
        output_dir = os.path.dirname(args.output)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
        logger.info(f"Saved optimization results to {args.output}")
    
    return results

def main():
    """Main entry point"""
    # Parse command line arguments
    args = parse_args()
    
    # Set up configuration
    config_dir = args.config_dir
    if not os.path.exists(config_dir):
        print(f"Error: Configuration directory not found: {config_dir}")
        sys.exit(1)
    
    # Set up logging
    log_level = getattr(logging, args.log_level)
    setup_logging("logs", None, log_level, console_output=True)
    
    # Determine which accounts to optimize
    accounts_to_optimize = []
    
    if args.account:
        # Optimize specific account
        accounts_to_optimize = [args.account]
    elif args.all_accounts:
        # Optimize all accounts
        accounts_to_optimize = get_account_list(config_dir)
    else:
        print("Please specify either --account or --all-accounts")
        sys.exit(1)
    
    if not accounts_to_optimize:
        print("No accounts found to optimize")
        sys.exit(1)
    
    logger.info(f"Starting optimization for {len(accounts_to_optimize)} accounts")
    
    # Process each account
    all_results = {}
    for account_id in accounts_to_optimize:
        try:
            account_results = optimize_account(account_id, args, config_dir)
            all_results[account_id] = account_results
            logger.info(f"Completed optimization for account {account_id}")
        except Exception as e:
            logger.error(f"Error optimizing account {account_id}: {e}", exc_info=True)
    
    logger.info("Optimization process completed")
    
    # Print summary
    print("\nOptimization Summary:")
    print("=====================")
    for account_id, results in all_results.items():
        campaign_count = len(results.get("campaigns", []))
        changes_applied = sum(1 for c in results.get("campaigns", []) 
                            if c.get("changes_applied", False))
        
        print(f"Account {account_id}: {campaign_count} campaigns processed, "
              f"{changes_applied} with changes applied")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 