#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API Request Handler
------------------

This module handles API requests, rate limiting, retries,
and error handling for the Google Ads API.
"""

import time
import logging
import random
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
from functools import wraps
from datetime import datetime, timedelta

from google.ads.googleads.errors import GoogleAdsException

# Configure logger
logger = logging.getLogger(__name__)

# Type variable for generic return type
T = TypeVar('T')

class RateLimiter:
    """
    Implements rate limiting for Google Ads API requests.
    Uses the token bucket algorithm to manage request rates.
    """
    
    def __init__(self, 
                 requests_per_second: float = 2.0,
                 burst_size: int = 5):
        """
        Initialize the rate limiter
        
        Args:
            requests_per_second: Maximum sustainable request rate
            burst_size: Maximum number of requests that can be made in a burst
        """
        self.requests_per_second = requests_per_second
        self.burst_size = burst_size
        self.tokens = burst_size
        self.last_refill_time = time.time()
        
    def _refill_tokens(self) -> None:
        """Refill tokens based on time elapsed since last refill"""
        now = time.time()
        time_elapsed = now - self.last_refill_time
        new_tokens = time_elapsed * self.requests_per_second
        
        if new_tokens > 0:
            self.tokens = min(self.tokens + new_tokens, self.burst_size)
            self.last_refill_time = now
    
    def acquire(self) -> float:
        """
        Acquire a token for making a request
        
        Returns:
            Time to wait (in seconds) before making the request
        """
        self._refill_tokens()
        
        if self.tokens >= 1:
            self.tokens -= 1
            return 0.0
        else:
            # Calculate time to wait for next token
            time_to_wait = (1 - self.tokens) / self.requests_per_second
            # Add jitter to avoid request bunching
            time_to_wait += random.uniform(0, 0.1)
            return time_to_wait

class RequestHandler:
    """Handles API requests with rate limiting and retry logic"""
    
    def __init__(self,
                 max_retries: int = 3,
                 retry_delay: float = 1.0,
                 backoff_factor: float = 2.0,
                 requests_per_second: float = 2.0):
        """
        Initialize the request handler
        
        Args:
            max_retries: Maximum number of retry attempts
            retry_delay: Initial delay between retries (in seconds)
            backoff_factor: Multiplicative factor for retry backoff
            requests_per_second: Maximum request rate per second
        """
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.backoff_factor = backoff_factor
        self.rate_limiter = RateLimiter(requests_per_second=requests_per_second)
        
        # Request statistics
        self.request_count = 0
        self.error_count = 0
        self.retry_count = 0
        self.start_time = datetime.now()
        
    def execute_with_retry(self, 
                           func: Callable[..., T], 
                           *args, 
                           **kwargs) -> T:
        """
        Execute a function with retry logic and rate limiting
        
        Args:
            func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            Return value of the function
            
        Raises:
            Exception: If all retries fail
        """
        retries = 0
        last_exception = None
        
        while retries <= self.max_retries:
            # Apply rate limiting
            wait_time = self.rate_limiter.acquire()
            if wait_time > 0:
                logger.debug(f"Rate limit: waiting {wait_time:.2f} seconds")
                time.sleep(wait_time)
            
            try:
                self.request_count += 1
                return func(*args, **kwargs)
                
            except GoogleAdsException as ex:
                self.error_count += 1
                error = ex.failure.errors[0]
                error_code = error.error_code.name
                
                # Determine if we should retry based on error type
                if error_code in ['RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED', 
                                 'INTERNAL', 'UNAVAILABLE']:
                    retries += 1
                    self.retry_count += 1
                    
                    if retries <= self.max_retries:
                        # Calculate backoff with jitter
                        delay = self.retry_delay * (self.backoff_factor ** (retries - 1))
                        jitter = random.uniform(0, 0.1 * delay)
                        wait_time = delay + jitter
                        
                        logger.warning(
                            f"Request failed with {error_code}. "
                            f"Retrying in {wait_time:.2f}s ({retries}/{self.max_retries})"
                        )
                        time.sleep(wait_time)
                        last_exception = ex
                    else:
                        logger.error(f"All retries failed: {error.message}")
                        raise
                else:
                    # Non-retryable error
                    logger.error(f"Non-retryable error: {error_code} - {error.message}")
                    raise
                    
            except Exception as e:
                self.error_count += 1
                retries += 1
                self.retry_count += 1
                
                if retries <= self.max_retries:
                    delay = self.retry_delay * (self.backoff_factor ** (retries - 1))
                    logger.warning(
                        f"Unexpected error: {str(e)}. "
                        f"Retrying in {delay:.2f}s ({retries}/{self.max_retries})"
                    )
                    time.sleep(delay)
                    last_exception = e
                else:
                    logger.error(f"All retries failed: {str(e)}")
                    raise
        
        # If we've exhausted all retries
        if last_exception:
            raise last_exception
            
        # This should never happen, but just in case
        raise Exception("Unexpected retry loop exit")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get request statistics
        
        Returns:
            Dictionary with request statistics
        """
        elapsed_time = (datetime.now() - self.start_time).total_seconds()
        request_rate = self.request_count / elapsed_time if elapsed_time > 0 else 0
        
        return {
            'request_count': self.request_count,
            'error_count': self.error_count,
            'retry_count': self.retry_count,
            'elapsed_time': elapsed_time,
            'request_rate': request_rate,
            'start_time': self.start_time.isoformat(),
            'current_time': datetime.now().isoformat()
        }
    
    def reset_stats(self) -> None:
        """Reset request statistics"""
        self.request_count = 0
        self.error_count = 0
        self.retry_count = 0
        self.start_time = datetime.now()

# Decorator for adding retry logic to functions
def with_retry(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Decorator to add retry logic to a function
    
    Args:
        max_retries: Maximum number of retries
        retry_delay: Initial delay between retries
        
    Returns:
        Decorated function with retry logic
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            handler = RequestHandler(
                max_retries=max_retries,
                retry_delay=retry_delay
            )
            return handler.execute_with_retry(func, *args, **kwargs)
        return wrapper
    return decorator 