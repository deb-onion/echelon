import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const Recommendations = () => {
  const { selectedAccount } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for selected recommendations
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Fetch recommendations
  const { data, isLoading, error } = useQuery(
    ['recommendations', selectedAccount],
    () => api.recommendations.getAccountRecommendations(selectedAccount),
    {
      enabled: !!selectedAccount,
      select: (response) => response.data,
    }
  );
  
  // Apply recommendations mutation
  const applyMutation = useMutation(
    (campaignIds) => api.recommendations.applyRecommendations(selectedAccount, campaignIds),
    {
      onSuccess: () => {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries(['recommendations']);
        queryClient.invalidateQueries(['campaigns']);
      },
    }
  );
  
  // Toggle campaign selection
  const toggleCampaignSelection = (campaignId) => {
    setSelectedCampaigns((prev) => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };
  
  // Handle "Apply Selected" button click
  const handleApplySelected = () => {
    if (selectedCampaigns.length > 0) {
      setConfirmDialogOpen(true);
    }
  };
  
  // Handle confirmation dialog
  const handleConfirmApply = () => {
    applyMutation.mutate(selectedCampaigns);
    setConfirmDialogOpen(false);
    setSelectedCampaigns([]);
  };
  
  // Format health score
  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'success' };
    if (score >= 60) return { label: 'Good', color: 'info' };
    if (score >= 40) return { label: 'Fair', color: 'warning' };
    return { label: 'Poor', color: 'error' };
  };
  
  // Format adjustment display
  const formatAdjustment = (value) => {
    if (value === 'N/A') return value;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    const color = numValue > 0 ? 'success' : numValue < 0 ? 'error' : 'default';
    return <Chip label={value} color={color} size="small" />;
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (!data || !data.recommendations) return null;
    
    const recommendations = data.recommendations;
    
    // Count campaigns by health score
    const healthCounts = {
      excellent: 0, // 80-100
      good: 0,      // 60-79
      fair: 0,      // 40-59
      poor: 0       // 0-39
    };
    
    recommendations.forEach(rec => {
      const score = rec.health_score;
      if (score >= 80) healthCounts.excellent++;
      else if (score >= 60) healthCounts.good++;
      else if (score >= 40) healthCounts.fair++;
      else healthCounts.poor++;
    });
    
    return {
      labels: ['Excellent', 'Good', 'Fair', 'Poor'],
      datasets: [
        {
          data: [
            healthCounts.excellent,
            healthCounts.good,
            healthCounts.fair,
            healthCounts.poor
          ],
          backgroundColor: [
            '#4caf50', // green
            '#2196f3', // blue
            '#ff9800', // orange
            '#f44336', // red
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">Loading recommendations...</Typography>
        </Box>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading recommendations: {error.message}
        </Alert>
      </Box>
    );
  }
  
  const recommendations = data?.recommendations || [];
  const chartData = getChartData();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Optimization Recommendations
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {recommendations.length === 0 ? (
        <Alert severity="info">
          No recommendations available for this account at this time.
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Campaign Health" />
                <CardContent>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                    {chartData && <Doughnut data={chartData} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Optimization Potential" />
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ color: 'primary.main' }}>
                      {recommendations.filter(r => r.has_recommendations).length}
                    </Typography>
                    <Typography variant="subtitle1">
                      Campaigns with recommendations
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Actions" />
                <CardContent>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={selectedCampaigns.length === 0}
                    onClick={handleApplySelected}
                    sx={{ mb: 2 }}
                  >
                    Apply Selected ({selectedCampaigns.length})
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setSelectedCampaigns([])}
                    disabled={selectedCampaigns.length === 0}
                  >
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Recommendations Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedCampaigns.length > 0 && 
                        selectedCampaigns.length < recommendations.filter(r => r.has_recommendations).length
                      }
                      checked={
                        recommendations.filter(r => r.has_recommendations).length > 0 &&
                        selectedCampaigns.length === recommendations.filter(r => r.has_recommendations).length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampaigns(
                            recommendations
                              .filter(r => r.has_recommendations)
                              .map(r => r.campaign_id)
                          );
                        } else {
                          setSelectedCampaigns([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Health Score</TableCell>
                  <TableCell>Bid Adjustment</TableCell>
                  <TableCell>Budget Adjustment</TableCell>
                  <TableCell>Improvements</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recommendations.map((recommendation) => {
                  const health = getHealthStatus(recommendation.health_score);
                  
                  return (
                    <TableRow key={recommendation.campaign_id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCampaigns.includes(recommendation.campaign_id)}
                          onChange={() => toggleCampaignSelection(recommendation.campaign_id)}
                          disabled={!recommendation.has_recommendations}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {recommendation.campaign_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${recommendation.health_score}/100 (${health.label})`}
                          color={health.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatAdjustment(recommendation.bid_adjustment)}</TableCell>
                      <TableCell>{formatAdjustment(recommendation.budget_adjustment)}</TableCell>
                      <TableCell>
                        {recommendation.improvement_count > 0 ? (
                          <Chip 
                            label={`${recommendation.improvement_count} suggestions`}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label="No suggestions"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/campaign/${recommendation.campaign_id}`)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
          >
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to apply the recommended changes to {selectedCampaigns.length} campaign(s)?
                This will modify your live Google Ads campaigns.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmApply}
                color="primary"
                variant="contained"
                disabled={applyMutation.isLoading}
              >
                {applyMutation.isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Apply Changes"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Recommendations; 