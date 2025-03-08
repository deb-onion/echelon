#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Merchant Center Models
---------------------

Pydantic models for Merchant Center API requests and responses.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class FeedType(str, Enum):
    """Feed types in Google Merchant Center."""
    PRIMARY = "PRIMARY"
    SUPPLEMENTAL = "SUPPLEMENTAL"
    PRICE = "PRICE"
    INVENTORY = "INVENTORY"


class ProductStatus(str, Enum):
    """Product approval status."""
    APPROVED = "approved"
    DISAPPROVED = "disapproved"
    PENDING = "pending"


class MerchantAccount(BaseModel):
    """Merchant Center account information."""
    id: str
    name: str
    domain: Optional[str] = None
    accountStatus: str


class MerchantAccountSummary(MerchantAccount):
    """Summary of a Merchant Center account including product counts."""
    totalProducts: int
    approvedProducts: int
    disapprovedProducts: int
    pendingProducts: int


class Price(BaseModel):
    """Product price information."""
    value: float
    currency: str = "USD"


class ProductIssue(BaseModel):
    """Information about a product issue."""
    code: str
    severity: str  # 'error' or 'warning'
    resolution: Optional[str] = None


class Product(BaseModel):
    """Product information from Merchant Center."""
    id: str
    title: str
    link: Optional[str] = None
    price: Price
    availability: str
    imageLink: Optional[str] = None
    gtin: Optional[str] = None
    brand: Optional[str] = None
    status: ProductStatus
    issues: List[ProductIssue] = []


class PaginationInfo(BaseModel):
    """Pagination information for list endpoints."""
    page: int
    limit: int
    total: int
    hasMore: bool


class ProductsResponse(BaseModel):
    """Response model for product listing endpoint."""
    products: List[Product]
    pagination: PaginationInfo


class AggregatedIssue(BaseModel):
    """Aggregated information about a product issue."""
    code: str
    severity: str  # 'error' or 'warning'
    count: int
    description: Optional[str] = None
    resolution: Optional[str] = None
    affectedSample: List[str] = []


class ProductFeed(BaseModel):
    """Information about a product feed."""
    id: str
    name: str
    feedType: FeedType
    fileType: str
    status: str
    processingStatus: str
    itemsTotal: int
    itemsProcessed: int
    itemsSuccessful: int
    itemsWithWarnings: int
    itemsWithErrors: int
    lastUploadDate: str
    targetCountries: List[str] = ["US"]


class FeedUploadRequest(BaseModel):
    """Request model for feed upload endpoint."""
    feedType: FeedType = FeedType.PRIMARY
    targetCountries: List[str] = ["US"]
    # The actual file will be sent as form data


class FeedUploadResponse(BaseModel):
    """Response model for feed upload endpoint."""
    feedId: str
    status: str
    message: str 