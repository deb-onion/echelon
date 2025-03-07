#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Authentication Module for Google Ads API
----------------------------------------

This module handles OAuth 2.0 authentication with Google Ads API.
It manages authentication flows, token refresh, and credential storage.
"""

import os
import json
import datetime
import logging
from typing import Dict, Optional, Tuple

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleads import adwords
from google.ads.googleads.client import GoogleAdsClient

# Configure logger
logger = logging.getLogger(__name__)

class GoogleAdsAuthentication:
    """
    Handles authentication with Google Ads API using OAuth 2.0
    """
    def __init__(self, 
                 client_config_path: str,
                 credentials_path: str,
                 scopes: list = None):
        """
        Initialize the authentication handler
        
        Args:
            client_config_path: Path to client configuration file (client_secrets.json)
            credentials_path: Path to store user credentials
            scopes: OAuth scopes required for the application
        """
        self.client_config_path = client_config_path
        self.credentials_path = credentials_path
        self.scopes = scopes or [
            'https://www.googleapis.com/auth/adwords',
            'https://www.googleapis.com/auth/analytics.readonly'
        ]
        self.credentials = None
        
    def authenticate(self) -> Credentials:
        """
        Authenticate with Google Ads API
        
        Returns:
            Valid OAuth2 credentials
        """
        # Check for existing credentials
        if os.path.exists(self.credentials_path):
            try:
                with open(self.credentials_path, 'r') as token_file:
                    token_data = json.load(token_file)
                    self.credentials = Credentials.from_authorized_user_info(
                        token_data, self.scopes)
            except Exception as e:
                logger.error(f"Error loading credentials: {e}")
                self.credentials = None
        
        # If credentials don't exist or are invalid, refresh/create them
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                try:
                    self.credentials.refresh(Request())
                except Exception as e:
                    logger.error(f"Error refreshing credentials: {e}")
                    return self._run_oauth_flow()
            else:
                return self._run_oauth_flow()
                
            # Save refreshed credentials
            self._save_credentials()
            
        return self.credentials
    
    def _run_oauth_flow(self) -> Credentials:
        """
        Run the OAuth flow to get new credentials
        
        Returns:
            New OAuth2 credentials
        """
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                self.client_config_path, self.scopes)
            self.credentials = flow.run_local_server(port=0)
            self._save_credentials()
            logger.info("Successfully completed OAuth flow and obtained new credentials")
            return self.credentials
        except Exception as e:
            logger.error(f"Failed to run OAuth flow: {e}")
            raise
    
    def _save_credentials(self) -> None:
        """Save credentials to the specified file"""
        credentials_data = {
            'token': self.credentials.token,
            'refresh_token': self.credentials.refresh_token,
            'token_uri': self.credentials.token_uri,
            'client_id': self.credentials.client_id,
            'client_secret': self.credentials.client_secret,
            'scopes': self.credentials.scopes,
            'expiry': self.credentials.expiry.isoformat() if self.credentials.expiry else None
        }
        
        os.makedirs(os.path.dirname(self.credentials_path), exist_ok=True)
        with open(self.credentials_path, 'w') as token_file:
            json.dump(credentials_data, token_file)
        
        logger.info(f"Credentials saved to {self.credentials_path}")
    
    def get_google_ads_client(self, google_ads_yaml_path: str) -> GoogleAdsClient:
        """
        Get a GoogleAdsClient instance
        
        Args:
            google_ads_yaml_path: Path to the google-ads.yaml configuration file
            
        Returns:
            Configured GoogleAdsClient instance
        """
        self.authenticate()  # Ensure we have valid credentials
        
        try:
            # Load client configuration from YAML
            return GoogleAdsClient.load_from_storage(google_ads_yaml_path)
        except Exception as e:
            logger.error(f"Error creating Google Ads client: {e}")
            raise
    
    def get_adwords_client(self, google_ads_yaml_path: str) -> adwords.AdWordsClient:
        """
        Get an AdWordsClient instance (legacy API)
        
        Args:
            google_ads_yaml_path: Path to the googleads.yaml configuration file
            
        Returns:
            Configured AdWordsClient instance
        """
        self.authenticate()  # Ensure we have valid credentials
        
        try:
            # Load the client configuration from YAML
            return adwords.AdWordsClient.LoadFromStorage(google_ads_yaml_path)
        except Exception as e:
            logger.error(f"Error creating AdWords client: {e}")
            raise

def get_authenticated_client(config_dir: str, account_id: str = None) -> Tuple[GoogleAdsClient, Optional[str]]:
    """
    Helper function to get an authenticated Google Ads client
    
    Args:
        config_dir: Directory containing configuration files
        account_id: Optional account ID to use
        
    Returns:
        Tuple of (GoogleAdsClient instance, login_customer_id if provided)
    """
    client_config_path = os.path.join(config_dir, 'client_secrets.json')
    credentials_path = os.path.join(config_dir, 'google_ads_credentials.json')
    google_ads_yaml_path = os.path.join(config_dir, 'google-ads.yaml')
    
    auth = GoogleAdsAuthentication(
        client_config_path=client_config_path,
        credentials_path=credentials_path
    )
    
    client = auth.get_google_ads_client(google_ads_yaml_path)
    return client, account_id 