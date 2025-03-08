#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Merchant Center Client
---------------------------

Unit tests for the Merchant Center client.
"""

import unittest
import os
import json
from unittest.mock import patch, MagicMock
from datetime import datetime

from src.core.merchant_center_client import MerchantCenterClient
from src.models.merchant import (
    MerchantAccount,
    ProductFeed,
    ProductStatus,
    Product
)


class TestMerchantCenterClient(unittest.TestCase):
    """Test cases for the Merchant Center client."""

    def setUp(self):
        """Set up test environment."""
        # Create mock credentials
        self.config_dir = "./mock_config"
        self.merchant_id = "12345678"
        
        # Patch the initialization
        patcher = patch('src.core.merchant_center_client.get_authenticated_client')
        self.addCleanup(patcher.stop)
        self.mock_get_client = patcher.start()
        
        # Mock Google Ads client with credentials
        mock_google_ads_client = MagicMock()
        mock_google_ads_client._credentials = MagicMock()
        self.mock_get_client.return_value = (mock_google_ads_client, None)
        
        # Patch API clients
        patcher_content = patch('src.core.merchant_center_client.build')
        self.addCleanup(patcher_content.stop)
        self.mock_build = patcher_content.start()
        
        # Mock Content API
        self.mock_content_api = MagicMock()
        self.mock_shopping_api = MagicMock()
        
        # Configure mock build to return our mock APIs
        def side_effect(service, version, credentials):
            if service == 'content':
                return self.mock_content_api
            elif service == 'shopping':
                return self.mock_shopping_api
            return MagicMock()
        
        self.mock_build.side_effect = side_effect
        
        # Create client
        self.client = MerchantCenterClient(
            config_dir=self.config_dir,
            merchant_id=self.merchant_id
        )
    
    def test_initialization(self):
        """Test client initialization."""
        self.assertEqual(self.client.merchant_id, self.merchant_id)
        self.assertEqual(self.client.config_dir, self.config_dir)
        self.mock_get_client.assert_called_once_with(
            config_dir=self.config_dir,
            account_id=None
        )
        self.assertEqual(self.client.content_api, self.mock_content_api)
        self.assertEqual(self.client.shopping_api, self.mock_shopping_api)
    
    def test_get_merchant_accounts(self):
        """Test getting merchant accounts."""
        # Prepare mock response
        mock_response = {
            'resources': [
                {
                    'id': '12345678',
                    'name': 'Test Merchant',
                    'websiteUrl': 'https://example.com',
                    'accountStatus': 'ACTIVE'
                }
            ]
        }
        
        # Configure mock API
        mock_accounts = MagicMock()
        mock_list = MagicMock()
        mock_execute = MagicMock(return_value=mock_response)
        
        self.mock_content_api.accounts.return_value = mock_accounts
        mock_accounts.list.return_value = mock_list
        mock_list.execute.return_value = mock_response
        
        # Call method
        result = self.client.get_merchant_accounts()
        
        # Assert
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['id'], '12345678')
        self.assertEqual(result[0]['name'], 'Test Merchant')
        self.assertEqual(result[0]['domain'], 'https://example.com')
        self.assertEqual(result[0]['accountStatus'], 'ACTIVE')
        
        # Assert API calls
        self.mock_content_api.accounts.assert_called_once()
        mock_accounts.list.assert_called_once()
        mock_list.execute.assert_called_once()
    
    def test_get_feeds(self):
        """Test getting product feeds."""
        # Prepare mock responses
        mock_feed_statuses_response = {
            'resources': [
                {
                    'datafeedId': '11111',
                    'status': 'ACTIVE',
                    'processingStatus': 'SUCCESS',
                    'itemsTotal': 100,
                    'itemsProcessed': 100,
                    'itemsSuccessful': 95,
                    'itemsWarning': 3,
                    'itemsError': 2,
                    'lastUploadDate': '2023-01-01T12:00:00Z'
                }
            ]
        }
        
        mock_feed_details_response = {
            'id': '11111',
            'name': 'Test Feed',
            'feedType': 'PRIMARY',
            'fileFormat': {'fileEncoding': 'CSV'},
            'targetCountry': ['US', 'CA']
        }
        
        # Configure mock APIs
        mock_feedstatuses = MagicMock()
        mock_list = MagicMock()
        mock_list_execute = MagicMock(return_value=mock_feed_statuses_response)
        
        mock_feeds = MagicMock()
        mock_get = MagicMock()
        mock_get_execute = MagicMock(return_value=mock_feed_details_response)
        
        self.mock_content_api.datafeedstatuses.return_value = mock_feedstatuses
        mock_feedstatuses.list.return_value = mock_list
        mock_list.execute.return_value = mock_feed_statuses_response
        
        self.mock_content_api.datafeeds.return_value = mock_feeds
        mock_feeds.get.return_value = mock_get
        mock_get.execute.return_value = mock_feed_details_response
        
        # Call method
        result = self.client.get_feeds()
        
        # Assert
        self.assertEqual(len(result), 1)
        feed = result[0]
        self.assertEqual(feed['id'], '11111')
        self.assertEqual(feed['name'], 'Test Feed')
        self.assertEqual(feed['feedType'], 'PRIMARY')
        self.assertEqual(feed['fileType'], 'CSV')
        self.assertEqual(feed['status'], 'ACTIVE')
        self.assertEqual(feed['processingStatus'], 'SUCCESS')
        self.assertEqual(feed['itemsTotal'], 100)
        self.assertEqual(feed['itemsProcessed'], 100)
        self.assertEqual(feed['itemsSuccessful'], 95)
        self.assertEqual(feed['itemsWithWarnings'], 3)
        self.assertEqual(feed['itemsWithErrors'], 2)
        self.assertEqual(feed['targetCountries'], ['US', 'CA'])
        self.assertEqual(feed['lastUploadDate'], '2023-01-01T12:00:00Z')
        
        # Assert API calls
        self.mock_content_api.datafeedstatuses.assert_called_once()
        mock_feedstatuses.list.assert_called_once_with(merchantId=self.merchant_id)
        mock_list.execute.assert_called_once()
        
        self.mock_content_api.datafeeds.assert_called_once()
        mock_feeds.get.assert_called_once_with(
            merchantId=self.merchant_id,
            datafeedId='11111'
        )
        mock_get.execute.assert_called_once()
    
    def test_get_products(self):
        """Test getting products."""
        # Prepare mock responses
        mock_products_response = {
            'resources': [
                {
                    'id': 'product123',
                    'title': 'Test Product',
                    'link': 'https://example.com/product123',
                    'price': {'value': '19.99', 'currency': 'USD'},
                    'availability': 'in stock',
                    'imageLink': 'https://example.com/image123.jpg',
                    'gtin': '1234567890123',
                    'brand': 'Test Brand'
                }
            ],
            'totalMatchingProducts': 1
        }
        
        mock_statuses_response = {
            'resources': [
                {
                    'productId': 'product123',
                    'status': 'APPROVED',
                    'itemLevelIssues': [
                        {
                            'code': 'warning123',
                            'severity': 'WARNING',
                            'resolution': 'Fix something'
                        }
                    ]
                }
            ]
        }
        
        # Configure mock APIs
        mock_products = MagicMock()
        mock_products_list = MagicMock()
        mock_products_execute = MagicMock(return_value=mock_products_response)
        
        mock_statuses = MagicMock()
        mock_statuses_list = MagicMock()
        mock_statuses_execute = MagicMock(return_value=mock_statuses_response)
        
        self.mock_content_api.products.return_value = mock_products
        mock_products.list.return_value = mock_products_list
        mock_products_list.execute.return_value = mock_products_response
        
        self.mock_shopping_api.productstatuses.return_value = mock_statuses
        mock_statuses.list.return_value = mock_statuses_list
        mock_statuses_list.execute.return_value = mock_statuses_response
        
        # Call method
        result = self.client.get_products(page=1, limit=10)
        
        # Assert
        self.assertEqual(len(result['products']), 1)
        product = result['products'][0]
        self.assertEqual(product['id'], 'product123')
        self.assertEqual(product['title'], 'Test Product')
        self.assertEqual(product['link'], 'https://example.com/product123')
        self.assertEqual(product['price']['value'], 19.99)
        self.assertEqual(product['price']['currency'], 'USD')
        self.assertEqual(product['availability'], 'in stock')
        self.assertEqual(product['imageLink'], 'https://example.com/image123.jpg')
        self.assertEqual(product['gtin'], '1234567890123')
        self.assertEqual(product['brand'], 'Test Brand')
        self.assertEqual(product['status'], 'approved')
        self.assertEqual(len(product['issues']), 1)
        self.assertEqual(product['issues'][0]['code'], 'warning123')
        self.assertEqual(product['issues'][0]['severity'], 'warning')
        
        # Assert pagination
        pagination = result['pagination']
        self.assertEqual(pagination['page'], 1)
        self.assertEqual(pagination['limit'], 10)
        self.assertEqual(pagination['total'], 1)
        self.assertEqual(pagination['hasMore'], False)
        
        # Assert API calls
        self.mock_content_api.products.assert_called_once()
        mock_products.list.assert_called_once_with(
            merchantId=self.merchant_id,
            maxResults=10,
            startToken=None,
            includeInvalidInsertedItems=True
        )
        mock_products_list.execute.assert_called_once()
        
        self.mock_shopping_api.productstatuses.assert_called_once()
        mock_statuses.list.assert_called_once_with(
            merchantId=self.merchant_id,
            includeInvalidInsertedItems=True,
            productIds=['product123']
        )
        mock_statuses_list.execute.assert_called_once()


if __name__ == '__main__':
    unittest.main() 