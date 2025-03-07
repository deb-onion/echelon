#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Google Ads API Client
---------------------

This module provides a client for interacting with the Google Ads API.
It handles API client initialization, version management, and basic operations.
"""

import os
import logging
import yaml
from typing import Dict, List, Optional, Any, Union, Tuple
import time
from datetime import datetime

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.protobuf.json_format import MessageToDict

from src.core.authentication import get_authenticated_client

# Configure logger
logger = logging.getLogger(__name__)

class GoogleAdsApiClient:
    """Client for interacting with the Google Ads API"""
    
    def __init__(self, config_dir: str, account_id: Optional[str] = None):
        """
        Initialize the Google Ads API client
        
        Args:
            config_dir: Directory containing configuration files
            account_id: Google Ads account ID (customer ID)
        """
        self.config_dir = config_dir
        self.account_id = account_id
        self.client, self.login_customer_id = get_authenticated_client(config_dir, account_id)
        self.version = self._get_api_version()
        
        # Initialize service cache
        self._service_cache = {}
        
    def _get_api_version(self) -> str:
        """
        Get the API version from the configuration file or use the latest
        
        Returns:
            API version string (e.g., 'v14')
        """
        yaml_path = os.path.join(self.config_dir, 'google-ads.yaml')
        try:
            with open(yaml_path, 'r') as yaml_file:
                config = yaml.safe_load(yaml_file)
                return config.get('api_version', 'v14')
        except Exception as e:
            logger.warning(f"Could not read API version from config: {e}")
            return 'v14'  # Default to a recent version
    
    def get_service(self, service_name: str):
        """
        Get a Google Ads API service client
        
        Args:
            service_name: Name of the service (e.g., 'GoogleAdsService')
            
        Returns:
            Service client instance
        """
        if service_name in self._service_cache:
            return self._service_cache[service_name]
        
        try:
            service = self.client.get_service(service_name, version=self.version)
            self._service_cache[service_name] = service
            return service
        except Exception as e:
            logger.error(f"Error getting service {service_name}: {e}")
            raise
    
    def get_resource_name(self, resource_type: str, resource_id: str) -> str:
        """
        Generate a resource name for a Google Ads resource
        
        Args:
            resource_type: Type of resource (e.g., 'customer', 'campaign')
            resource_id: ID of the resource
            
        Returns:
            Formatted resource name
        """
        account_id = self.account_id or self.login_customer_id
        if not account_id:
            raise ValueError("Account ID must be provided")
        
        if resource_type == 'customer':
            return f"customers/{account_id}"
        elif resource_type == 'campaign':
            return f"customers/{account_id}/campaigns/{resource_id}"
        elif resource_type == 'ad_group':
            return f"customers/{account_id}/adGroups/{resource_id}"
        elif resource_type == 'ad':
            return f"customers/{account_id}/ads/{resource_id}"
        elif resource_type == 'keyword':
            return f"customers/{account_id}/keywords/{resource_id}"
        else:
            raise ValueError(f"Unsupported resource type: {resource_type}")
    
    def execute_query(self, query: str, retry_count: int = 3, 
                     retry_delay: int = 5) -> List[Dict[str, Any]]:
        """
        Execute a GAQL (Google Ads Query Language) query
        
        Args:
            query: GAQL query string
            retry_count: Number of retry attempts
            retry_delay: Delay between retries (in seconds)
            
        Returns:
            List of result rows as dictionaries
        """
        service = self.get_service('GoogleAdsService')
        request = self.client.get_type('SearchGoogleAdsRequest')
        
        if self.account_id:
            request.customer_id = self.account_id
        elif self.login_customer_id:
            request.customer_id = self.login_customer_id
        else:
            raise ValueError("No account ID available")
        
        request.query = query
        request.page_size = 1000  # Set a reasonable page size
        
        for attempt in range(retry_count):
            try:
                response = service.search(request=request)
                results = []
                
                # Convert protocol buffer objects to dictionaries
                for row in response:
                    row_dict = MessageToDict(row._pb)
                    results.append(row_dict)
                
                return results
                
            except GoogleAdsException as ex:
                error = ex.failure.errors[0]
                logger.error(f"Request failed with status {error.error_code.name}")
                
                # Check if this is a rate limit error (RESOURCE_EXHAUSTED)
                if error.error_code.name == 'RESOURCE_EXHAUSTED' and attempt < retry_count - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.info(f"Rate limited. Waiting {wait_time} seconds before retry.")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Google Ads API error: {error.message}")
                    raise
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                if attempt < retry_count - 1:
                    time.sleep(retry_delay)
                else:
                    raise
        
        raise Exception(f"Query failed after {retry_count} attempts")
    
    def get_account_info(self) -> Dict[str, Any]:
        """
        Get basic information about the current account
        
        Returns:
            Dictionary with account information
        """
        query = """
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.tracking_url_template,
          customer.auto_tagging_enabled
        FROM customer
        LIMIT 1
        """
        
        results = self.execute_query(query)
        if results:
            return results[0].get('customer', {})
        return {}
    
    def get_campaign_list(self, status_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get a list of campaigns in the account
        
        Args:
            status_filter: Optional list of campaign statuses to filter by
            
        Returns:
            List of campaign data dictionaries
        """
        status_clause = ""
        if status_filter:
            status_values = ", ".join([f"CAMPAIGN_STATUS_{s.upper()}" for s in status_filter])
            status_clause = f"AND campaign.status IN ({status_values})"
            
        query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.start_date,
          campaign.end_date,
          campaign.budget.amount_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE campaign.id > 0 {status_clause}
        ORDER BY campaign.id
        """
        
        return self.execute_query(query)

    def set_account_id(self, account_id: str) -> None:
        """
        Set or change the account ID for this client
        
        Args:
            account_id: The new account ID to use
        """
        self.account_id = account_id
        # Clear service cache when changing accounts
        self._service_cache = {} 