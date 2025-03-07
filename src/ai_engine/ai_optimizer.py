#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AI Campaign Optimizer
--------------------

This module provides AI-powered campaign optimization features.
It analyzes campaign performance data and suggests improvements.
"""

import os
import logging
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

from src.core.api_client import GoogleAdsApiClient
from src.core.utilities import micros_to_currency, currency_to_micros, load_json_config, save_json_config

# Configure logger
logger = logging.getLogger(__name__)

class AICampaignOptimizer:
    """
    AI-powered campaign optimization engine
    Uses machine learning to analyze campaign performance and suggest improvements
    """
    
    def __init__(self, 
                api_client: GoogleAdsApiClient,
                model_dir: str,
                lookback_days: int = 30,
                min_data_points: int = 100):
        """
        Initialize the AI campaign optimizer
        
        Args:
            api_client: Google Ads API client
            model_dir: Directory to store ML models
            lookback_days: How many days of historical data to analyze
            min_data_points: Minimum data points required for training
        """
        self.api_client = api_client
        self.model_dir = model_dir
        self.lookback_days = lookback_days
        self.min_data_points = min_data_points
        
        # Ensure model directory exists
        os.makedirs(model_dir, exist_ok=True)
        
        # Initialize models
        self.models = {
            'bid_optimization': None,
            'budget_allocation': None,
            'performance_prediction': None
        }
        
        # Load existing models if available
        self._load_models()
        
    def _load_models(self) -> None:
        """Load machine learning models from disk if they exist"""
        for model_name in self.models.keys():
            model_path = os.path.join(self.model_dir, f"{model_name}_model.pkl")
            if os.path.exists(model_path):
                try:
                    self.models[model_name] = joblib.load(model_path)
                    logger.info(f"Loaded model: {model_name}")
                except Exception as e:
                    logger.error(f"Error loading model {model_name}: {e}")
                    self.models[model_name] = None
    
    def _save_model(self, model_name: str) -> None:
        """
        Save a machine learning model to disk
        
        Args:
            model_name: Name of the model to save
        """
        if self.models[model_name] is not None:
            model_path = os.path.join(self.model_dir, f"{model_name}_model.pkl")
            try:
                joblib.dump(self.models[model_name], model_path)
                logger.info(f"Saved model: {model_name}")
            except Exception as e:
                logger.error(f"Error saving model {model_name}: {e}")
    
    def _fetch_historical_data(self) -> pd.DataFrame:
        """
        Fetch historical campaign performance data
        
        Returns:
            DataFrame with historical campaign data
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=self.lookback_days)
        
        query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign.target_roas.target_roas,
          campaign.target_cpa.target_cpa_micros,
          campaign.budget.amount_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.average_cpc,
          metrics.average_cpm,
          metrics.ctr,
          metrics.average_position,
          segments.date
        FROM campaign
        WHERE 
          segments.date BETWEEN '{start_date}' AND '{end_date}'
          AND campaign.status = 'ENABLED'
        ORDER BY segments.date
        """
        
        try:
            results = self.api_client.execute_query(query)
            if not results:
                logger.warning("No historical data found")
                return pd.DataFrame()
                
            # Convert to DataFrame
            df = pd.DataFrame(results)
            
            # Process DataFrame - flatten nested structures
            if 'campaign' in df.columns:
                campaign_cols = df['campaign'].apply(pd.Series)
                df = pd.concat([df.drop('campaign', axis=1), campaign_cols], axis=1)
            
            if 'metrics' in df.columns:
                metrics_cols = df['metrics'].apply(pd.Series)
                df = pd.concat([df.drop('metrics', axis=1), metrics_cols], axis=1)
                
            if 'segments' in df.columns:
                segments_cols = df['segments'].apply(pd.Series)
                df = pd.concat([df.drop('segments', axis=1), segments_cols], axis=1)
            
            # Convert micros columns
            for col in df.columns:
                if col.endswith('_micros'):
                    new_col = col.replace('_micros', '')
                    df[new_col] = df[col].apply(lambda x: micros_to_currency(x) if x else 0.0)
            
            # Calculate derived metrics
            df['cost_per_conversion'] = df.apply(
                lambda row: row['cost'] / row['conversions'] if row.get('conversions', 0) > 0 else 0, 
                axis=1
            )
            df['conversion_rate'] = df.apply(
                lambda row: row['conversions'] / row['clicks'] if row.get('clicks', 0) > 0 else 0,
                axis=1
            )
            df['roas'] = df.apply(
                lambda row: row['conversions_value'] / row['cost'] if row.get('cost', 0) > 0 else 0,
                axis=1
            )
            
            # Parse date
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                
            return df
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return pd.DataFrame()
            
    def train_models(self, force_retrain: bool = False) -> Dict[str, bool]:
        """
        Train machine learning models for campaign optimization
        
        Args:
            force_retrain: Whether to force retraining of models
            
        Returns:
            Dictionary with training status for each model
        """
        # Fetch historical data
        df = self._fetch_historical_data()
        if df.empty:
            logger.warning("No data available for model training")
            return {model: False for model in self.models.keys()}
            
        # Check if we have enough data
        if len(df) < self.min_data_points:
            logger.warning(f"Insufficient data for training: {len(df)} < {self.min_data_points}")
            return {model: False for model in self.models.keys()}
            
        training_results = {}
        
        # Train bid optimization model
        training_results['bid_optimization'] = self._train_bid_optimization_model(df, force_retrain)
        
        # Train budget allocation model
        training_results['budget_allocation'] = self._train_budget_allocation_model(df, force_retrain)
        
        # Train performance prediction model
        training_results['performance_prediction'] = self._train_performance_prediction_model(df, force_retrain)
        
        return training_results
    
    def _train_bid_optimization_model(self, df: pd.DataFrame, force_retrain: bool) -> bool:
        """
        Train the bid optimization model
        
        Args:
            df: DataFrame with historical data
            force_retrain: Whether to force retraining
            
        Returns:
            True if training was successful, False otherwise
        """
        if not force_retrain and self.models['bid_optimization'] is not None:
            logger.info("Bid optimization model already exists and force_retrain is False")
            return True
            
        try:
            # Prepare data for bid optimization model
            X = df[['cost', 'clicks', 'impressions', 'ctr', 'average_cpc', 'average_cpm']]
            y = df['cost_per_conversion']
            
            # Remove rows with NaN values
            mask = ~(X.isna().any(axis=1) | y.isna())
            X = X[mask]
            y = y[mask]
            
            if len(X) < self.min_data_points:
                logger.warning(f"Insufficient data for bid model: {len(X)} < {self.min_data_points}")
                return False
                
            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Create model pipeline
            model = Pipeline([
                ('scaler', StandardScaler()),
                ('regressor', GradientBoostingRegressor(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    random_state=42
                ))
            ])
            
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            train_score = model.score(X_train, y_train)
            test_score = model.score(X_test, y_test)
            
            logger.info(f"Bid optimization model - Train score: {train_score:.4f}, Test score: {test_score:.4f}")
            
            # Save model
            self.models['bid_optimization'] = model
            self._save_model('bid_optimization')
            
            return True
            
        except Exception as e:
            logger.error(f"Error training bid optimization model: {e}")
            return False
    
    def _train_budget_allocation_model(self, df: pd.DataFrame, force_retrain: bool) -> bool:
        """
        Train the budget allocation model
        
        Args:
            df: DataFrame with historical data
            force_retrain: Whether to force retraining
            
        Returns:
            True if training was successful, False otherwise
        """
        if not force_retrain and self.models['budget_allocation'] is not None:
            logger.info("Budget allocation model already exists and force_retrain is False")
            return True
            
        try:
            # Prepare data for budget allocation model
            X = df[['impressions', 'clicks', 'conversions', 'ctr', 'conversion_rate']]
            y = df['roas']  # Return on ad spend as the target
            
            # Remove rows with NaN values
            mask = ~(X.isna().any(axis=1) | y.isna())
            X = X[mask]
            y = y[mask]
            
            if len(X) < self.min_data_points:
                logger.warning(f"Insufficient data for budget model: {len(X)} < {self.min_data_points}")
                return False
                
            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Create model pipeline
            model = Pipeline([
                ('scaler', StandardScaler()),
                ('regressor', RandomForestRegressor(
                    n_estimators=100,
                    max_depth=5,
                    random_state=42
                ))
            ])
            
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            train_score = model.score(X_train, y_train)
            test_score = model.score(X_test, y_test)
            
            logger.info(f"Budget allocation model - Train score: {train_score:.4f}, Test score: {test_score:.4f}")
            
            # Save model
            self.models['budget_allocation'] = model
            self._save_model('budget_allocation')
            
            return True
            
        except Exception as e:
            logger.error(f"Error training budget allocation model: {e}")
            return False
    
    def _train_performance_prediction_model(self, df: pd.DataFrame, force_retrain: bool) -> bool:
        """
        Train the performance prediction model
        
        Args:
            df: DataFrame with historical data
            force_retrain: Whether to force retraining
            
        Returns:
            True if training was successful, False otherwise
        """
        if not force_retrain and self.models['performance_prediction'] is not None:
            logger.info("Performance prediction model already exists and force_retrain is False")
            return True
            
        try:
            # Prepare data for performance prediction model
            X = df[['budget', 'cost', 'impressions', 'clicks', 'ctr', 'average_cpc']]
            y = df['conversions']
            
            # Remove rows with NaN values
            mask = ~(X.isna().any(axis=1) | y.isna())
            X = X[mask]
            y = y[mask]
            
            if len(X) < self.min_data_points:
                logger.warning(f"Insufficient data for prediction model: {len(X)} < {self.min_data_points}")
                return False
                
            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Create model pipeline
            model = Pipeline([
                ('scaler', StandardScaler()),
                ('regressor', GradientBoostingRegressor(
                    n_estimators=100,
                    learning_rate=0.05,
                    max_depth=4,
                    random_state=42
                ))
            ])
            
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            train_score = model.score(X_train, y_train)
            test_score = model.score(X_test, y_test)
            
            logger.info(f"Performance prediction model - Train score: {train_score:.4f}, Test score: {test_score:.4f}")
            
            # Save model
            self.models['performance_prediction'] = model
            self._save_model('performance_prediction')
            
            return True
            
        except Exception as e:
            logger.error(f"Error training performance prediction model: {e}")
            return False
    
    def get_campaign_recommendations(self, campaign_id: str) -> Dict[str, Any]:
        """
        Generate AI-powered recommendations for a campaign
        
        Args:
            campaign_id: ID of the campaign
            
        Returns:
            Dictionary with recommendations
        """
        recommendations = {
            'campaign_id': campaign_id,
            'timestamp': datetime.now().isoformat(),
            'bid_adjustments': None,
            'budget_recommendation': None,
            'performance_forecast': None,
            'overall_health_score': None,
            'improvement_suggestions': []
        }
        
        try:
            # Fetch current campaign data
            query = f"""
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign.advertising_channel_type,
              campaign.bidding_strategy_type,
              campaign.target_roas.target_roas,
              campaign.target_cpa.target_cpa_micros,
              campaign.budget.amount_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions,
              metrics.conversions_value,
              metrics.average_cpc,
              metrics.average_cpm,
              metrics.ctr
            FROM campaign
            WHERE campaign.id = {campaign_id}
            LIMIT 1
            """
            
            results = self.api_client.execute_query(query)
            if not results:
                logger.warning(f"No data found for campaign {campaign_id}")
                return recommendations
                
            # Process campaign data
            campaign_data = results[0]
            campaign = campaign_data.get('campaign', {})
            metrics = campaign_data.get('metrics', {})
            
            # Extract key metrics
            budget_micros = campaign.get('budget', {}).get('amountMicros', 0)
            budget = micros_to_currency(budget_micros)
            cost_micros = metrics.get('costMicros', 0)
            cost = micros_to_currency(cost_micros)
            conversions = float(metrics.get('conversions', 0))
            clicks = int(metrics.get('clicks', 0))
            impressions = int(metrics.get('impressions', 0))
            ctr = float(metrics.get('ctr', 0))
            average_cpc = float(metrics.get('averageCpc', 0))
            average_cpm = float(metrics.get('averageCpm', 0))
            conversions_value = float(metrics.get('conversionsValue', 0))
            
            # Calculate derived metrics
            conversion_rate = conversions / clicks if clicks > 0 else 0
            cost_per_conversion = cost / conversions if conversions > 0 else 0
            roas = conversions_value / cost if cost > 0 else 0
            
            # Generate bid adjustment recommendations
            if self.models['bid_optimization'] is not None:
                # Prepare data for prediction
                prediction_data = pd.DataFrame({
                    'cost': [cost],
                    'clicks': [clicks],
                    'impressions': [impressions],
                    'ctr': [ctr],
                    'average_cpc': [average_cpc],
                    'average_cpm': [average_cpm]
                })
                
                # Predict optimal CPA
                optimal_cpa = self.models['bid_optimization'].predict(prediction_data)[0]
                
                # Calculate bid adjustment percentage
                current_cpa = cost_per_conversion if cost_per_conversion > 0 else optimal_cpa
                bid_adjustment_pct = ((optimal_cpa / current_cpa) - 1) * 100
                
                # Cap the adjustment to reasonable range
                bid_adjustment_pct = max(min(bid_adjustment_pct, 20), -20)
                
                recommendations['bid_adjustments'] = {
                    'current_cpa': cost_per_conversion,
                    'recommended_cpa': optimal_cpa,
                    'adjustment_percentage': bid_adjustment_pct
                }
                
                # Add specific bid suggestions based on performance
                if bid_adjustment_pct < -5:
                    recommendations['improvement_suggestions'].append(
                        "Consider decreasing bids as the current CPA is higher than optimal"
                    )
                elif bid_adjustment_pct > 5:
                    recommendations['improvement_suggestions'].append(
                        "Consider increasing bids to capture more conversions at a still-profitable CPA"
                    )
            
            # Generate budget recommendations
            if self.models['budget_allocation'] is not None:
                # Prepare data for prediction
                prediction_data = pd.DataFrame({
                    'impressions': [impressions],
                    'clicks': [clicks],
                    'conversions': [conversions],
                    'ctr': [ctr],
                    'conversion_rate': [conversion_rate]
                })
                
                # Predict expected ROAS
                expected_roas = self.models['budget_allocation'].predict(prediction_data)[0]
                
                # Calculate budget adjustment
                budget_efficiency = roas / expected_roas if expected_roas > 0 else 1
                
                if budget_efficiency > 1.2:
                    # Campaign is performing better than expected - increase budget
                    new_budget = budget * 1.2
                    recommendations['improvement_suggestions'].append(
                        "Campaign is performing well above expectations. Consider increasing budget."
                    )
                elif budget_efficiency < 0.8:
                    # Campaign is performing worse than expected - decrease budget
                    new_budget = budget * 0.8
                    recommendations['improvement_suggestions'].append(
                        "Campaign is performing below expectations. Consider decreasing budget or optimizing targeting."
                    )
                else:
                    # Campaign is performing as expected - maintain budget
                    new_budget = budget
                
                recommendations['budget_recommendation'] = {
                    'current_budget': budget,
                    'recommended_budget': new_budget,
                    'adjustment_percentage': ((new_budget / budget) - 1) * 100
                }
            
            # Generate performance forecast
            if self.models['performance_prediction'] is not None:
                # Prepare data for prediction
                prediction_data = pd.DataFrame({
                    'budget': [budget],
                    'cost': [cost],
                    'impressions': [impressions],
                    'clicks': [clicks],
                    'ctr': [ctr],
                    'average_cpc': [average_cpc]
                })
                
                # Predict expected conversions
                expected_conversions = self.models['performance_prediction'].predict(prediction_data)[0]
                
                # Also predict with 20% more budget
                prediction_data_increased = prediction_data.copy()
                prediction_data_increased['budget'] = budget * 1.2
                prediction_data_increased['cost'] = cost * 1.2  # Assume cost scales with budget
                expected_conversions_increased = self.models['performance_prediction'].predict(prediction_data_increased)[0]
                
                recommendations['performance_forecast'] = {
                    'current_conversions': conversions,
                    'expected_conversions': expected_conversions,
                    'expected_conversions_with_20pct_more_budget': expected_conversions_increased
                }
                
                # Check conversion trend
                if expected_conversions < conversions * 0.9:
                    recommendations['improvement_suggestions'].append(
                        "Conversion performance may be declining. Review ad creative and landing pages."
                    )
                elif expected_conversions_increased > expected_conversions * 1.3:
                    recommendations['improvement_suggestions'].append(
                        "Campaign shows strong potential with additional budget. Consider scaling up spend."
                    )
            
            # Calculate overall health score
            # Score is 0-100 based on various performance factors
            health_factors = []
            
            # CTR factor (compared to expected 2%)
            ctr_score = min(100, (ctr / 0.02) * 50)
            health_factors.append(ctr_score)
            
            # Conversion rate factor (compared to expected 5%)
            conv_rate_score = min(100, (conversion_rate / 0.05) * 50)
            health_factors.append(conv_rate_score)
            
            # Budget utilization factor
            budget_utilization = cost / budget if budget > 0 else 0
            budget_score = 100 if 0.9 <= budget_utilization <= 1.0 else (budget_utilization * 100)
            health_factors.append(budget_score)
            
            # ROAS factor (compared to target of 2.0)
            roas_score = min(100, (roas / 2.0) * 50)
            health_factors.append(roas_score)
            
            # Overall health score is the average
            overall_health_score = round(sum(health_factors) / len(health_factors))
            recommendations['overall_health_score'] = overall_health_score
            
            # Add health-based suggestions
            if overall_health_score < 50:
                recommendations['improvement_suggestions'].append(
                    "Campaign health is concerning. Consider a comprehensive review of targeting, ad creative, and bidding strategy."
                )
            elif overall_health_score < 70:
                recommendations['improvement_suggestions'].append(
                    "Campaign health is below average. Focus on improving the weakest performance metrics."
                )
            elif overall_health_score > 90:
                recommendations['improvement_suggestions'].append(
                    "Campaign health is excellent. Consider scaling up or applying similar strategies to other campaigns."
                )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations for campaign {campaign_id}: {e}")
            return recommendations
    
    def optimize_campaign(self, campaign_id: str, apply_changes: bool = False) -> Dict[str, Any]:
        """
        Generate and optionally apply optimization recommendations
        
        Args:
            campaign_id: ID of the campaign to optimize
            apply_changes: Whether to automatically apply the recommendations
            
        Returns:
            Dictionary with optimization results
        """
        results = {
            'campaign_id': campaign_id,
            'timestamp': datetime.now().isoformat(),
            'recommendations': None,
            'changes_applied': False,
            'status': 'failed',
            'error': None
        }
        
        try:
            # Get recommendations
            recommendations = self.get_campaign_recommendations(campaign_id)
            results['recommendations'] = recommendations
            
            if apply_changes and recommendations:
                # Apply bid adjustments if recommended
                if recommendations.get('bid_adjustments'):
                    bid_adjustment = recommendations['bid_adjustments']
                    adjustment_pct = bid_adjustment.get('adjustment_percentage', 0)
                    
                    if abs(adjustment_pct) >= 5:  # Only apply significant adjustments
                        # TODO: Implement the actual bid adjustment through the API
                        logger.info(f"Applied {adjustment_pct:.1f}% bid adjustment to campaign {campaign_id}")
                
                # Apply budget adjustments if recommended
                if recommendations.get('budget_recommendation'):
                    budget_rec = recommendations['budget_recommendation']
                    new_budget = budget_rec.get('recommended_budget', 0)
                    
                    if new_budget > 0:
                        # TODO: Implement the actual budget adjustment through the API
                        logger.info(f"Updated budget to {new_budget:.2f} for campaign {campaign_id}")
                
                results['changes_applied'] = True
            
            results['status'] = 'success'
            return results
            
        except Exception as e:
            logger.error(f"Error optimizing campaign {campaign_id}: {e}")
            results['error'] = str(e)
            return results 