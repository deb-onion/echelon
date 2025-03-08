#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ECHELON API
-----------

This is the main FastAPI application for the ECHELON 
Google Ads Management System API backend.
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import routers
from src.routes import (
    ads,
    auth,
    campaigns,
    dashboard,
    ecommerce,
    audit,
    optimization,
    merchant  # Merchant Center routes
)

# Create FastAPI app
app = FastAPI(
    title="ECHELON Google Ads Management API",
    description="API for managing Google Ads campaigns with AI-driven optimization",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to ECHELON Google Ads Management API",
        "documentation": "/docs",
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(ads.router)
app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(dashboard.router)
app.include_router(ecommerce.router)
app.include_router(audit.router)
app.include_router(optimization.router)
app.include_router(merchant.router)  # Add this line to include Merchant Center routes

# Run with uvicorn in development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 