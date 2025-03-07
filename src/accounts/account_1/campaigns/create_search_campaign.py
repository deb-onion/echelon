#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Create Search Campaign
--------------------

Module for creating Search campaigns in Google Ads.
Handles campaign creation, ad group setup, keyword addition,
and ad creative generation for Search campaigns.
"""

import os
import logging
import uuid
from typing import Dict, List, Optional, Union, Any, Tuple
from datetime import datetime, timedelta

from src.core.api_client import GoogleAdsApiClient
from src.core.request_handler import with_retry
from src.core.utilities import (
    currency_to_micros, 
    validate_url, 
    format_date,
    load_json_config
)

# Configure logger
logger = logging.getLogger(__name__)

class SearchCampaignCreator:
    """
    Creates and configures Google Ads Search campaigns
    """
    
    def __init__(self, api_client: GoogleAdsApiClient, config_dir: str):
        """
        Initialize the Search campaign creator
        
        Args:
            api_client: Google Ads API client
            config_dir: Directory with configuration files
        """
        self.api_client = api_client
        self.config_dir = config_dir
        self.client = api_client.client
        
        # Load defaults from config if available
        self.defaults = self._load_defaults()
    
    def _load_defaults(self) -> Dict[str, Any]:
        """
        Load default settings for search campaigns
        
        Returns:
            Dictionary with default settings
        """
        default_config_path = os.path.join(self.config_dir, 'search_campaign_defaults.json')
        
        # If config exists, load it
        if os.path.exists(default_config_path):
            return load_json_config(default_config_path)
        
        # Otherwise, return sensible defaults
        return {
            'budget_amount': 50.0,  # Daily budget in account currency
            'bid_amount': 1.0,      # Default max CPC bid
            'target_cpa': None,     # For target CPA bidding strategy
            'target_roas': None,    # For target ROAS bidding strategy
            'network_settings': {
                'target_google_search': True,
                'target_search_network': True,
                'target_content_network': False,
                'target_partner_search_network': False
            },
            'geo_targets': [
                {'location_id': 2840, 'targeting_type': 'LOCATION_OF_PRESENCE'}  # US
            ],
            'language_targets': [1000],  # English
            'ad_rotation_type': 'OPTIMIZE',
            'keyword_match_types': ['BROAD', 'PHRASE', 'EXACT'],
            'status': 'PAUSED'  # Start as paused for review
        }
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def create_campaign(self, 
                        campaign_name: str,
                        start_date: Optional[str] = None,
                        end_date: Optional[str] = None,
                        budget_amount: Optional[float] = None,
                        bidding_strategy: str = 'MANUAL_CPC',
                        target_cpa: Optional[float] = None,
                        target_roas: Optional[float] = None,
                        network_settings: Optional[Dict[str, bool]] = None,
                        geo_targets: Optional[List[Dict[str, Any]]] = None,
                        language_targets: Optional[List[int]] = None,
                        status: str = 'PAUSED') -> str:
        """
        Create a new Search campaign
        
        Args:
            campaign_name: Name of the campaign
            start_date: Optional start date (YYYY-MM-DD format, defaults to today)
            end_date: Optional end date (YYYY-MM-DD format)
            budget_amount: Daily budget amount (in account currency)
            bidding_strategy: Bidding strategy to use
            target_cpa: Target CPA amount (for TARGET_CPA strategy)
            target_roas: Target ROAS (for TARGET_ROAS strategy)
            network_settings: Dictionary of network targeting settings
            geo_targets: List of geographic targeting settings
            language_targets: List of language IDs to target
            status: Initial campaign status (ENABLED or PAUSED)
            
        Returns:
            ID of the created campaign
        """
        # Use defaults for any missing values
        budget_amount = budget_amount or self.defaults['budget_amount']
        network_settings = network_settings or self.defaults['network_settings']
        geo_targets = geo_targets or self.defaults['geo_targets']
        language_targets = language_targets or self.defaults['language_targets']
        status = status or self.defaults['status']
        target_cpa = target_cpa or self.defaults.get('target_cpa')
        target_roas = target_roas or self.defaults.get('target_roas')
        
        # Format dates
        if not start_date:
            start_date = datetime.now().strftime('%Y%m%d')
        else:
            # Convert YYYY-MM-DD to YYYYMMDD
            start_date = start_date.replace('-', '')
            
        if end_date:
            # Convert YYYY-MM-DD to YYYYMMDD
            end_date = end_date.replace('-', '')
        
        try:
            # Create a budget
            campaign_budget_service = self.api_client.get_service('CampaignBudgetService')
            campaign_service = self.api_client.get_service('CampaignService')
            
            # Create campaign budget
            campaign_budget_operation = self.client.get_type('CampaignBudgetOperation')
            campaign_budget = campaign_budget_operation.create
            
            campaign_budget.name = f"{campaign_name} Budget"
            campaign_budget.amount_micros = currency_to_micros(budget_amount)
            campaign_budget.delivery_method = self.client.enums.BudgetDeliveryMethodEnum.STANDARD
            campaign_budget.explicitly_shared = False
            
            # Add budget
            campaign_budget_response = campaign_budget_service.mutate_campaign_budgets(
                customer_id=self.api_client.account_id,
                operations=[campaign_budget_operation]
            )
            budget_resource_name = campaign_budget_response.results[0].resource_name
            
            # Create campaign
            campaign_operation = self.client.get_type('CampaignOperation')
            campaign = campaign_operation.create
            
            # Basic campaign settings
            campaign.name = campaign_name
            campaign.advertising_channel_type = self.client.enums.AdvertisingChannelTypeEnum.SEARCH
            campaign.status = getattr(self.client.enums.CampaignStatusEnum, status)
            campaign.campaign_budget = budget_resource_name
            
            # Set bidding strategy
            if bidding_strategy == 'MANUAL_CPC':
                campaign.manual_cpc.enhanced_cpc_enabled = True
            elif bidding_strategy == 'MAXIMIZE_CONVERSIONS':
                campaign.maximize_conversions.target_cpa_micros = (
                    currency_to_micros(target_cpa) if target_cpa else None
                )
            elif bidding_strategy == 'MAXIMIZE_CONVERSION_VALUE':
                campaign.maximize_conversion_value.target_roas = target_roas if target_roas else None
            elif bidding_strategy == 'TARGET_CPA':
                campaign.target_cpa.target_cpa_micros = currency_to_micros(target_cpa)
            elif bidding_strategy == 'TARGET_ROAS':
                campaign.target_roas.target_roas = target_roas
            
            # Set campaign dates
            campaign.start_date = start_date
            if end_date:
                campaign.end_date = end_date
                
            # Set network settings
            campaign.network_settings.target_google_search = network_settings.get('target_google_search', True)
            campaign.network_settings.target_search_network = network_settings.get('target_search_network', True)
            campaign.network_settings.target_content_network = network_settings.get('target_content_network', False)
            campaign.network_settings.target_partner_search_network = network_settings.get('target_partner_search_network', False)
            
            # Create campaign
            campaign_response = campaign_service.mutate_campaigns(
                customer_id=self.api_client.account_id,
                operations=[campaign_operation]
            )
            campaign_resource_name = campaign_response.results[0].resource_name
            campaign_id = campaign_resource_name.split('/')[-1]
            
            # Set up geo targeting
            if geo_targets:
                self._add_geo_targeting(campaign_resource_name, geo_targets)
            
            # Set up language targeting
            if language_targets:
                self._add_language_targeting(campaign_resource_name, language_targets)
            
            logger.info(f"Created search campaign: {campaign_name} (ID: {campaign_id})")
            return campaign_id
            
        except Exception as e:
            logger.error(f"Error creating search campaign: {e}")
            raise
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def _add_geo_targeting(self, 
                          campaign_resource_name: str, 
                          geo_targets: List[Dict[str, Any]]) -> None:
        """
        Add geographic targeting to a campaign
        
        Args:
            campaign_resource_name: Resource name of the campaign
            geo_targets: List of geographic targets with location_id and targeting_type
        """
        campaign_criterion_service = self.api_client.get_service('CampaignCriterionService')
        operations = []
        
        for geo_target in geo_targets:
            location_id = geo_target['location_id']
            targeting_type = geo_target.get('targeting_type', 'LOCATION_OF_PRESENCE')
            
            operation = self.client.get_type('CampaignCriterionOperation')
            criterion = operation.create
            
            criterion.campaign = campaign_resource_name
            criterion.type_ = self.client.enums.CriterionTypeEnum.LOCATION
            criterion.location.geo_target_constant = self.client.get_service(
                'GeoTargetConstantService'
            ).geo_target_constant_path(location_id)
            
            # Set targeting type (e.g. presence, interest)
            if targeting_type == 'PRESENCE':
                criterion.location_group.feed_item_target_type = (
                    self.client.enums.FeedItemTargetingDimensionEnum.LOCATION
                )
            
            operations.append(operation)
        
        if operations:
            campaign_criterion_service.mutate_campaign_criteria(
                customer_id=self.api_client.account_id,
                operations=operations
            )
            logger.info(f"Added {len(operations)} geo targets to campaign")
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def _add_language_targeting(self, 
                               campaign_resource_name: str, 
                               language_ids: List[int]) -> None:
        """
        Add language targeting to a campaign
        
        Args:
            campaign_resource_name: Resource name of the campaign
            language_ids: List of language criterion IDs to target
        """
        campaign_criterion_service = self.api_client.get_service('CampaignCriterionService')
        operations = []
        
        for language_id in language_ids:
            operation = self.client.get_type('CampaignCriterionOperation')
            criterion = operation.create
            
            criterion.campaign = campaign_resource_name
            criterion.type_ = self.client.enums.CriterionTypeEnum.LANGUAGE
            criterion.language.language_constant = self.client.get_service(
                'LanguageConstantService'
            ).language_constant_path(language_id)
            
            operations.append(operation)
        
        if operations:
            campaign_criterion_service.mutate_campaign_criteria(
                customer_id=self.api_client.account_id,
                operations=operations
            )
            logger.info(f"Added {len(operations)} language targets to campaign")
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def create_ad_group(self, 
                       campaign_id: str,
                       ad_group_name: str,
                       bid_amount: Optional[float] = None,
                       status: str = 'PAUSED') -> str:
        """
        Create an ad group within a campaign
        
        Args:
            campaign_id: ID of the campaign
            ad_group_name: Name of the ad group
            bid_amount: Default CPC bid amount (in account currency)
            status: Initial ad group status (ENABLED or PAUSED)
            
        Returns:
            ID of the created ad group
        """
        # Use defaults for any missing values
        bid_amount = bid_amount or self.defaults.get('bid_amount', 1.0)
        
        try:
            ad_group_service = self.api_client.get_service('AdGroupService')
            
            # Create ad group
            operation = self.client.get_type('AdGroupOperation')
            ad_group = operation.create
            
            campaign_resource_name = self.api_client.get_resource_name('campaign', campaign_id)
            ad_group.name = ad_group_name
            ad_group.status = getattr(self.client.enums.AdGroupStatusEnum, status)
            ad_group.campaign = campaign_resource_name
            ad_group.type_ = self.client.enums.AdGroupTypeEnum.SEARCH_STANDARD
            ad_group.cpc_bid_micros = currency_to_micros(bid_amount)
            
            # Add ad group
            response = ad_group_service.mutate_ad_groups(
                customer_id=self.api_client.account_id,
                operations=[operation]
            )
            
            ad_group_resource_name = response.results[0].resource_name
            ad_group_id = ad_group_resource_name.split('/')[-1]
            
            logger.info(f"Created ad group: {ad_group_name} (ID: {ad_group_id})")
            return ad_group_id
            
        except Exception as e:
            logger.error(f"Error creating ad group: {e}")
            raise
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def add_keywords(self, 
                    ad_group_id: str,
                    keywords: List[str],
                    match_types: Optional[List[str]] = None,
                    status: str = 'PAUSED') -> List[str]:
        """
        Add keywords to an ad group
        
        Args:
            ad_group_id: ID of the ad group
            keywords: List of keyword texts
            match_types: List of match types to use (BROAD, PHRASE, EXACT)
            status: Initial keyword status (ENABLED or PAUSED)
            
        Returns:
            List of created keyword IDs
        """
        # Use defaults for any missing values
        if not match_types:
            match_types = self.defaults.get('keyword_match_types', ['BROAD', 'PHRASE', 'EXACT'])
        
        try:
            ad_group_criterion_service = self.api_client.get_service('AdGroupCriterionService')
            operations = []
            
            ad_group_resource_name = self.api_client.get_resource_name('ad_group', ad_group_id)
            
            # Create combinations of keywords and match types
            for keyword_text in keywords:
                for match_type in match_types:
                    operation = self.client.get_type('AdGroupCriterionOperation')
                    criterion = operation.create
                    
                    criterion.ad_group = ad_group_resource_name
                    criterion.status = getattr(self.client.enums.AdGroupCriterionStatusEnum, status)
                    criterion.keyword.text = keyword_text
                    criterion.keyword.match_type = getattr(
                        self.client.enums.KeywordMatchTypeEnum, match_type
                    )
                    
                    operations.append(operation)
            
            # Add all keywords
            response = ad_group_criterion_service.mutate_ad_group_criteria(
                customer_id=self.api_client.account_id,
                operations=operations
            )
            
            # Extract keyword IDs
            keyword_ids = []
            for result in response.results:
                keyword_id = result.resource_name.split('/')[-1]
                keyword_ids.append(keyword_id)
            
            logger.info(f"Added {len(keyword_ids)} keywords to ad group {ad_group_id}")
            return keyword_ids
            
        except Exception as e:
            logger.error(f"Error adding keywords: {e}")
            raise
    
    @with_retry(max_retries=3, retry_delay=2.0)
    def create_text_ads(self, 
                       ad_group_id: str,
                       headlines: List[str],
                       descriptions: List[str],
                       final_url: str,
                       path1: Optional[str] = None,
                       path2: Optional[str] = None,
                       status: str = 'PAUSED') -> List[str]:
        """
        Create expanded text ads in an ad group
        
        Args:
            ad_group_id: ID of the ad group
            headlines: List of headlines (at least 3 for RSAs)
            descriptions: List of descriptions (at least 2 for RSAs)
            final_url: Landing page URL
            path1: First path component for the display URL
            path2: Second path component for the display URL
            status: Initial ad status (ENABLED or PAUSED)
            
        Returns:
            List of created ad IDs
        """
        # Validate inputs
        if not validate_url(final_url):
            raise ValueError(f"Invalid URL format: {final_url}")
            
        if len(headlines) < 3:
            raise ValueError("At least 3 headlines required for Responsive Search Ads")
            
        if len(descriptions) < 2:
            raise ValueError("At least 2 descriptions required for Responsive Search Ads")
        
        try:
            ad_group_ad_service = self.api_client.get_service('AdGroupAdService')
            
            # Create responsive search ad operation
            operation = self.client.get_type('AdGroupAdOperation')
            ad_group_ad = operation.create
            
            ad_group_ad.ad_group = self.api_client.get_resource_name('ad_group', ad_group_id)
            ad_group_ad.status = getattr(self.client.enums.AdGroupAdStatusEnum, status)
            
            # Set up responsive search ad
            ad = ad_group_ad.ad
            ad.final_urls.append(final_url)
            
            # Add headlines
            for i, headline in enumerate(headlines[:15]):  # Max 15 headlines for RSA
                ad.responsive_search_ad.headlines.add()
                ad.responsive_search_ad.headlines[i].text = headline
                ad.responsive_search_ad.headlines[i].pinned_field = self.client.enums.ServedAssetFieldTypeEnum.UNSPECIFIED
            
            # Add descriptions
            for i, description in enumerate(descriptions[:4]):  # Max 4 descriptions for RSA
                ad.responsive_search_ad.descriptions.add()
                ad.responsive_search_ad.descriptions[i].text = description
                ad.responsive_search_ad.descriptions[i].pinned_field = self.client.enums.ServedAssetFieldTypeEnum.UNSPECIFIED
            
            # Add paths if provided
            if path1:
                ad.responsive_search_ad.path1 = path1
            if path2:
                ad.responsive_search_ad.path2 = path2
            
            # Add ad group ad
            response = ad_group_ad_service.mutate_ad_group_ads(
                customer_id=self.api_client.account_id,
                operations=[operation]
            )
            
            # Extract ad ID
            ad_id = response.results[0].resource_name.split('/')[-1]
            
            logger.info(f"Created responsive search ad in ad group {ad_group_id}, ad ID: {ad_id}")
            return [ad_id]
            
        except Exception as e:
            logger.error(f"Error creating text ads: {e}")
            raise
    
    def create_complete_search_campaign(self, 
                                        campaign_name: str,
                                        ad_groups: List[Dict[str, Any]],
                                        budget_amount: float,
                                        bidding_strategy: str = 'MANUAL_CPC',
                                        target_cpa: Optional[float] = None,
                                        target_roas: Optional[float] = None,
                                        start_date: Optional[str] = None,
                                        status: str = 'PAUSED') -> Dict[str, Any]:
        """
        Create a complete search campaign with ad groups, keywords, and ads
        
        Args:
            campaign_name: Name of the campaign
            ad_groups: List of dictionaries with ad group details:
                - name: Ad group name
                - keywords: List of keywords
                - headlines: List of headlines
                - descriptions: List of descriptions
                - final_url: Landing page URL
                - bid_amount: Optional default bid amount
            budget_amount: Daily budget amount (in account currency)
            bidding_strategy: Bidding strategy to use
            target_cpa: Target CPA amount (for TARGET_CPA strategy)
            target_roas: Target ROAS (for TARGET_ROAS strategy)
            start_date: Optional start date (YYYY-MM-DD format)
            status: Initial campaign status (ENABLED or PAUSED)
            
        Returns:
            Dictionary with campaign and ad group details
        """
        result = {
            'campaign_id': None,
            'campaign_name': campaign_name,
            'ad_groups': []
        }
        
        try:
            # Create campaign
            campaign_id = self.create_campaign(
                campaign_name=campaign_name,
                start_date=start_date,
                budget_amount=budget_amount,
                bidding_strategy=bidding_strategy,
                target_cpa=target_cpa,
                target_roas=target_roas,
                status=status
            )
            
            result['campaign_id'] = campaign_id
            
            # Create ad groups, keywords, and ads
            for ad_group_data in ad_groups:
                ad_group_result = {
                    'ad_group_id': None,
                    'ad_group_name': ad_group_data['name'],
                    'keyword_ids': [],
                    'ad_ids': []
                }
                
                # Create ad group
                ad_group_id = self.create_ad_group(
                    campaign_id=campaign_id,
                    ad_group_name=ad_group_data['name'],
                    bid_amount=ad_group_data.get('bid_amount'),
                    status=status
                )
                
                ad_group_result['ad_group_id'] = ad_group_id
                
                # Add keywords
                if 'keywords' in ad_group_data and ad_group_data['keywords']:
                    keyword_ids = self.add_keywords(
                        ad_group_id=ad_group_id,
                        keywords=ad_group_data['keywords'],
                        match_types=ad_group_data.get('match_types'),
                        status=status
                    )
                    ad_group_result['keyword_ids'] = keyword_ids
                
                # Create ads
                if ('headlines' in ad_group_data and 'descriptions' in ad_group_data and 
                    'final_url' in ad_group_data):
                    ad_ids = self.create_text_ads(
                        ad_group_id=ad_group_id,
                        headlines=ad_group_data['headlines'],
                        descriptions=ad_group_data['descriptions'],
                        final_url=ad_group_data['final_url'],
                        path1=ad_group_data.get('path1'),
                        path2=ad_group_data.get('path2'),
                        status=status
                    )
                    ad_group_result['ad_ids'] = ad_ids
                
                result['ad_groups'].append(ad_group_result)
            
            logger.info(f"Created complete search campaign: {campaign_name} with {len(ad_groups)} ad groups")
            return result
            
        except Exception as e:
            logger.error(f"Error creating complete search campaign: {e}")
            raise

# Example usage function
def create_example_search_campaign(api_client: GoogleAdsApiClient, config_dir: str) -> None:
    """
    Create an example search campaign
    
    Args:
        api_client: Google Ads API client
        config_dir: Configuration directory
    """
    creator = SearchCampaignCreator(api_client, config_dir)
    
    # Example ad group data
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
        },
        {
            'name': 'Generic Terms',
            'keywords': ['product category', 'buy product online', 'best product'],
            'match_types': ['BROAD', 'PHRASE'],
            'headlines': [
                'Top Rated Products',
                'Shop Quality Products',
                'Best Prices Online - Products'
            ],
            'descriptions': [
                'Find the perfect product for your needs. Free shipping available.',
                'High quality, competitive prices. Order now!'
            ],
            'final_url': 'https://www.example.com/products',
            'path1': 'products',
            'path2': 'online'
        }
    ]
    
    # Create campaign
    result = creator.create_complete_search_campaign(
        campaign_name='Example Search Campaign',
        ad_groups=ad_groups,
        budget_amount=50.0,
        bidding_strategy='MAXIMIZE_CONVERSIONS',
        status='PAUSED'
    )
    
    logger.info(f"Created campaign with ID: {result['campaign_id']}")
    
if __name__ == '__main__':
    # This code runs when the module is executed directly
    from src.core.utilities import setup_logging
    import os
    
    # Set up paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
    config_dir = os.path.join(base_dir, 'config')
    log_dir = os.path.join(base_dir, 'logs', 'account_1')
    
    # Set up logging
    logger = setup_logging(log_dir=log_dir, account_id='1', console_output=True)
    
    # Example account ID (replace with real one)
    account_id = '123-456-7890'
    
    # Initialize API client
    api_client = GoogleAdsApiClient(config_dir=config_dir, account_id=account_id)
    
    # Create example campaign
    create_example_search_campaign(api_client, config_dir) 