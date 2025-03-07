#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Utilities Module
---------------

This module provides common utilities for the Google Ads management system,
including logging setup, data validation, and helper functions.
"""

import os
import re
import json
import yaml
import logging
import logging.handlers
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime, date
import pandas as pd
import numpy as np

# Regular expression patterns for validation
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
CUSTOMER_ID_PATTERN = re.compile(r'^\d{3}-\d{3}-\d{4}$')
PHONE_PATTERN = re.compile(r'^\+?[0-9]{10,15}$')
URL_PATTERN = re.compile(
    r'^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
)

def setup_logging(
    log_dir: str,
    account_id: Optional[str] = None,
    log_level: int = logging.INFO,
    console_output: bool = True,
    log_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Set up logging for the application
    
    Args:
        log_dir: Directory where log files will be stored
        account_id: Optional account ID to create a dedicated log file
        log_level: Logging level (default: INFO)
        console_output: Whether to also log to console
        log_file_size: Maximum size of log file in bytes before rotation
        backup_count: Number of backup log files to keep
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Clear any existing handlers
    if logger.handlers:
        logger.handlers.clear()
    
    # Add console handler if requested
    if console_output:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(log_level)
        logger.addHandler(console_handler)
    
    # Create log directory if it doesn't exist
    if account_id:
        log_dir = os.path.join(log_dir, f"account_{account_id}")
    
    os.makedirs(log_dir, exist_ok=True)
    
    # Add file handlers for different log types
    file_handlers = {
        'error': os.path.join(log_dir, 'errors.log'),
        'performance': os.path.join(log_dir, 'performance.log'),
        'automation': os.path.join(log_dir, 'automation.log')
    }
    
    for log_type, log_path in file_handlers.items():
        file_handler = logging.handlers.RotatingFileHandler(
            log_path,
            maxBytes=log_file_size,
            backupCount=backup_count
        )
        file_handler.setFormatter(formatter)
        
        # Set different levels based on log type
        if log_type == 'error':
            file_handler.setLevel(logging.ERROR)
        else:
            file_handler.setLevel(log_level)
            
        logger.addHandler(file_handler)
    
    logger.info(f"Logging initialized for {'account ' + account_id if account_id else 'global'}")
    return logger

def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    return bool(EMAIL_PATTERN.match(email))

def validate_customer_id(customer_id: str) -> bool:
    """
    Validate Google Ads customer ID format (XXX-XXX-XXXX)
    
    Args:
        customer_id: Customer ID to validate
        
    Returns:
        True if valid, False otherwise
    """
    return bool(CUSTOMER_ID_PATTERN.match(customer_id))

def validate_url(url: str) -> bool:
    """
    Validate URL format
    
    Args:
        url: URL to validate
        
    Returns:
        True if valid, False otherwise
    """
    return bool(URL_PATTERN.match(url))

def format_customer_id(customer_id: str) -> str:
    """
    Format a customer ID to ensure it follows the XXX-XXX-XXXX pattern
    
    Args:
        customer_id: Customer ID to format
        
    Returns:
        Formatted customer ID
    """
    # Remove any non-digit characters
    digits = re.sub(r'\D', '', customer_id)
    
    # Check if we have 10 digits
    if len(digits) != 10:
        raise ValueError(f"Customer ID must have 10 digits, got: {len(digits)}")
    
    # Format as XXX-XXX-XXXX
    return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"

def micros_to_currency(micros: Union[int, float]) -> float:
    """
    Convert micro units to currency units (divide by 1,000,000)
    
    Args:
        micros: Amount in micro units
        
    Returns:
        Amount in currency units
    """
    return micros / 1_000_000 if micros is not None else 0.0

def currency_to_micros(currency: Union[int, float]) -> int:
    """
    Convert currency units to micro units (multiply by 1,000,000)
    
    Args:
        currency: Amount in currency units
        
    Returns:
        Amount in micro units as an integer
    """
    return int(currency * 1_000_000) if currency is not None else 0

def load_json_config(file_path: str) -> Dict[str, Any]:
    """
    Load a JSON configuration file
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        Dictionary with configuration
    """
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading JSON config from {file_path}: {e}")
        return {}

def save_json_config(config: Dict[str, Any], file_path: str) -> bool:
    """
    Save a dictionary to a JSON configuration file
    
    Args:
        config: Dictionary to save
        file_path: Path where to save the JSON file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        directory = os.path.dirname(file_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        with open(file_path, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving JSON config to {file_path}: {e}")
        return False

def load_yaml_config(file_path: str) -> Dict[str, Any]:
    """
    Load a YAML configuration file
    
    Args:
        file_path: Path to YAML file
        
    Returns:
        Dictionary with configuration
    """
    try:
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logging.error(f"Error loading YAML config from {file_path}: {e}")
        return {}

def save_yaml_config(config: Dict[str, Any], file_path: str) -> bool:
    """
    Save a dictionary to a YAML configuration file
    
    Args:
        config: Dictionary to save
        file_path: Path where to save the YAML file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        directory = os.path.dirname(file_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        with open(file_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        return True
    except Exception as e:
        logging.error(f"Error saving YAML config to {file_path}: {e}")
        return False

def format_date(date_obj: Union[str, datetime, date]) -> str:
    """
    Format a date object to YYYY-MM-DD format
    
    Args:
        date_obj: Date object or string
        
    Returns:
        Formatted date string
    """
    if isinstance(date_obj, str):
        try:
            # Try parsing the string to a date object
            date_obj = datetime.strptime(date_obj, '%Y-%m-%d').date()
        except ValueError:
            # If it fails, return the original string
            return date_obj
    
    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()
        
    return date_obj.strftime('%Y-%m-%d')

def convert_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert a list of dictionaries to a pandas DataFrame
    
    Args:
        data: List of dictionaries
        
    Returns:
        Pandas DataFrame
    """
    if not data:
        return pd.DataFrame()
        
    df = pd.DataFrame(data)
    
    # Convert micros columns to currency
    micros_columns = [col for col in df.columns if col.endswith('_micros')]
    for col in micros_columns:
        currency_col = col.replace('_micros', '')
        df[currency_col] = df[col].apply(lambda x: micros_to_currency(x) if pd.notnull(x) else None)
    
    return df

def get_account_path(base_dir: str, account_id: str) -> str:
    """
    Get the path to an account's directory
    
    Args:
        base_dir: Base directory
        account_id: Account ID
        
    Returns:
        Path to the account directory
    """
    # Format account ID if needed
    if validate_customer_id(account_id):
        # Replace hyphens for directory naming
        account_id = account_id.replace('-', '')
    
    account_dir = f"account_{account_id}"
    return os.path.join(base_dir, account_dir) 