#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Merchant Center Routes
---------------------

API routes for interacting with Google Merchant Center.
"""

import os
import logging
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, Request
from fastapi.responses import JSONResponse

from src.core.merchant_center_client import MerchantCenterClient
from src.core.authentication import get_authenticated_client
from src.models.merchant import (
    MerchantAccount,
    MerchantAccountSummary,
    ProductFeed,
    Product,
    ProductsResponse,
    AggregatedIssue,
    FeedType,
    FeedUploadResponse
)

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/merchants",
    tags=["Merchant Center"],
    responses={404: {"description": "Not found"}},
)


async def get_merchant_client(
    request: Request,
    merchant_id: str
) -> MerchantCenterClient:
    """
    Dependency to get a configured Merchant Center client.
    
    Args:
        request: FastAPI request object
        merchant_id: Merchant Center account ID
        
    Returns:
        Initialized MerchantCenterClient
    """
    config_dir = os.environ.get("GOOGLE_ADS_CONFIG_DIR", "./google-ads.yaml")
    try:
        # Create and return a new client
        return MerchantCenterClient(config_dir=config_dir, merchant_id=merchant_id)
    except Exception as e:
        logger.error(f"Error creating Merchant Center client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Merchant Center client: {str(e)}"
        )


@router.get(
    "",
    response_model=List[MerchantAccount],
    summary="Get all Merchant Center accounts",
    description="Returns a list of all Merchant Center accounts accessible to the authenticated user.",
)
async def get_merchants():
    """Get all Merchant Center accounts."""
    try:
        # Use a temporary client without a specific merchant ID
        config_dir = os.environ.get("GOOGLE_ADS_CONFIG_DIR", "./google-ads.yaml")
        client = MerchantCenterClient(config_dir=config_dir, merchant_id="0")
        
        # Get all merchant accounts
        return client.get_merchant_accounts()
    except Exception as e:
        logger.error(f"Error getting merchants: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve merchant accounts: {str(e)}"
        )


@router.get(
    "/{merchant_id}",
    response_model=MerchantAccountSummary,
    summary="Get a Merchant Center account summary",
    description="Returns summary information for a specific Merchant Center account.",
)
async def get_merchant_summary(
    merchant_id: str,
    client: MerchantCenterClient = Depends(get_merchant_client),
):
    """Get summary information for a specific Merchant Center account."""
    try:
        return client.get_account_summary()
    except Exception as e:
        logger.error(f"Error getting merchant summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve merchant account summary: {str(e)}"
        )


@router.get(
    "/{merchant_id}/feeds",
    response_model=List[ProductFeed],
    summary="Get product feeds",
    description="Returns a list of product feeds for the specified Merchant Center account.",
)
async def get_feeds(
    merchant_id: str,
    client: MerchantCenterClient = Depends(get_merchant_client),
):
    """Get product feeds for a Merchant Center account."""
    try:
        return client.get_feeds()
    except Exception as e:
        logger.error(f"Error getting feeds: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve product feeds: {str(e)}"
        )


@router.get(
    "/{merchant_id}/products",
    response_model=ProductsResponse,
    summary="Get products",
    description="Returns a paginated list of products for the specified Merchant Center account.",
)
async def get_products(
    merchant_id: str,
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=250, description="Number of products per page"),
    status: Optional[str] = Query(None, description="Filter by product status (approved, disapproved, pending)"),
    client: MerchantCenterClient = Depends(get_merchant_client),
):
    """Get products from a Merchant Center account with pagination and filtering."""
    try:
        return client.get_products(page=page, limit=limit, status=status)
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve products: {str(e)}"
        )


@router.get(
    "/{merchant_id}/issues",
    response_model=List[AggregatedIssue],
    summary="Get product issues",
    description="Returns a list of aggregated product issues for the specified Merchant Center account.",
)
async def get_product_issues(
    merchant_id: str,
    client: MerchantCenterClient = Depends(get_merchant_client),
):
    """Get aggregated product issues from a Merchant Center account."""
    try:
        return client.get_product_issues()
    except Exception as e:
        logger.error(f"Error getting product issues: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve product issues: {str(e)}"
        )


@router.post(
    "/{merchant_id}/feeds/upload",
    response_model=FeedUploadResponse,
    summary="Upload a product feed",
    description="Uploads a new product feed file to the specified Merchant Center account.",
)
async def upload_feed(
    merchant_id: str,
    background_tasks: BackgroundTasks,
    feed_file: UploadFile = File(...),
    feed_type: FeedType = Form(FeedType.PRIMARY),
    target_countries: Optional[List[str]] = Form(["US"]),
    client: MerchantCenterClient = Depends(get_merchant_client),
):
    """Upload a new product feed to a Merchant Center account."""
    try:
        # Read file content
        file_content = await feed_file.read()
        
        # Upload the feed
        result = client.upload_feed(
            feed_type=feed_type.value,
            file_content=file_content,
            file_name=feed_file.filename,
            target_countries=target_countries
        )
        
        return result
    except Exception as e:
        logger.error(f"Error uploading feed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload product feed: {str(e)}"
        ) 