#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AI Suggestions Demo
------------------

Demonstrates how to use the AccountOptimizer to view AI optimization suggestions
in a visual format for an individual account.
"""

import os
import sys
import argparse
from datetime import datetime

from src.bulk_operations.account_optimizer import AccountOptimizer

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Demo to view AI optimization suggestions in a visual format"
    )
    
    parser.add_argument(
        "--account", "-a", 
        type=str, 
        required=True,
        help="Account ID to optimize (format: XXX-XXX-XXXX)"
    )
    
    parser.add_argument(
        "--campaign", "-c", 
        type=str,
        help="Specific campaign ID (omit to view all campaigns)"
    )
    
    parser.add_argument(
        "--include-paused", 
        action="store_true",
        help="Include paused campaigns in the analysis"
    )
    
    parser.add_argument(
        "--save", "-s", 
        type=str,
        help="Save recommendations to a JSON file"
    )
    
    parser.add_argument(
        "--config-dir", 
        type=str, 
        default="config",
        help="Directory containing configuration files"
    )
    
    return parser.parse_args()

def main():
    """Main function"""
    args = parse_args()
    
    # Print header
    print("=" * 80)
    print(f"AI OPTIMIZATION SUGGESTIONS FOR ACCOUNT: {args.account}")
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Initialize the account optimizer
    optimizer = AccountOptimizer(
        account_id=args.account,
        config_dir=args.config_dir,
        log_level="INFO"
    )
    
    try:
        # Generate AI recommendations
        print("\nGenerating AI recommendations, please wait...")
        optimizer.generate_recommendations(
            campaign_id=args.campaign,
            include_paused=args.include_paused
        )
        
        # Display recommendations in a visual format
        optimizer.display_recommendations(args.campaign)
        
        # Save recommendations if requested
        if args.save:
            if optimizer.save_recommendations(args.save):
                print(f"\nRecommendations saved to: {args.save}")
            else:
                print("\nFailed to save recommendations")
        
        # Provide next steps guidance
        print("\nNext Steps:")
        print("  1. Review the suggestions above")
        print("  2. To apply changes interactively, run:")
        print(f"     python -m src.bulk_operations.account_optimizer --account {args.account} --action apply")
        if args.save:
            print(f"     python -m src.bulk_operations.account_optimizer --account {args.account} --action apply --input {args.save}")
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 