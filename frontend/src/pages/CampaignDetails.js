import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  TrendingUp,
  Edit,
  Report,
  Pause,
  PlayArrow
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const theme = useTheme();
  const { account } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Simulated data - replace with API calls in production
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          setCampaign({
            id: campaignId,
            name: 'Summer Sale Campaign 2023',
            status: 'ENABLED',
            budget: 500.00,
            budgetType: 'DAILY',
            bidStrategy: 'MAXIMIZE_CONVERSIONS',
            dailySpend: 320.45,
            totalSpend: 4580.35,
            impressions: 58490,
            clicks: 3245,
            conversions: 128,
            ctr: 5.54,
            cpc: 1.41,
            conversionRate: 3.94,
            costPerConversion: 35.78,
            startDate: '2023-06-01',
            endDate: null,
            targetedLocations: ['United States', 'Canada'],
            adGroups: [
              { id: 'ag1', name: 'Summer Dresses', status: 'ENABLED', impressions: 28340, clicks: 1854, conversions: 75 },
              { id: 'ag2', name: 'Beach Accessories', status: 'ENABLED', impressions: 16780, clicks: 845, conversions: 32 },
              { id: 'ag3', name: 'Sunglasses Collection', status: 'PAUSED', impressions: 13370, clicks: 546, conversions: 21 }
            ],
            performanceHistory: {
              labels: ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29', 'Jul 6', 'Jul 13'],
              datasets: [
                {
                  label: 'Clicks',
                  data: [420, 480, 540, 495, 550, 620, 580],
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary.main,
                  yAxisID: 'y',
                },
                {
                  label: 'Conversions',
                  data: [18, 21, 24, 19, 22, 26, 24],
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: theme.palette.secondary.main,
                  yAxisID: 'y1',
                },
              ],
            },
            recommendations: [
              { id: 'rec1', type: 'BID_ADJUSTMENT', description: 'Increase bids for mobile devices by 15%', impact: 'High', status: 'PENDING' },
              { id: 'rec2', type: 'KEYWORDS', description: 'Add negative keywords: "cheap", "discount"', impact: 'Medium', status: 'PENDING' },
              { id: 'rec3', type: 'AD_SCHEDULE', description: 'Reduce bids during low-performing hours (2AM-5AM)', impact: 'Medium', status: 'APPLIED' }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId, theme.palette.primary.main, theme.palette.secondary.main]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Clicks'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Conversions'
        }
      },
    },
  };

  // Tab content components
  const OverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Performance Overview</Typography>
          <Box sx={{ height: 300, mb: 3 }}>
            <Line options={chartOptions} data={campaign.performanceHistory} />
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Campaign Summary</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip 
                label={campaign.status === 'ENABLED' ? 'Active' : 'Paused'} 
                color={campaign.status === 'ENABLED' ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Budget</Typography>
              <Typography variant="body2">${campaign.budget.toFixed(2)} / day</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Bid Strategy</Typography>
              <Typography variant="body2">{campaign.bidStrategy.replace('_', ' ')}</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Start Date</Typography>
              <Typography variant="body2">{campaign.startDate}</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">End Date</Typography>
              <Typography variant="body2">{campaign.endDate || 'No end date'}</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Locations</Typography>
              <Typography variant="body2">{campaign.targetedLocations.join(', ')}</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Impressions</Typography>
                  <Typography variant="h6">{campaign.impressions.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Clicks</Typography>
                  <Typography variant="h6">{campaign.clicks.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>CTR</Typography>
                  <Typography variant="h6">{campaign.ctr}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Avg. CPC</Typography>
                  <Typography variant="h6">${campaign.cpc.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Conversions</Typography>
                  <Typography variant="h6">{campaign.conversions}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ backgroundColor: theme.palette.grey[50] }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Conv. Rate</Typography>
                  <Typography variant="h6">{campaign.conversionRate}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI Recommendations</Typography>
            <Button size="small" variant="outlined" startIcon={<TrendingUp />}>Apply All</Button>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Recommendation</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaign.recommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.type.replace('_', ' ')}</TableCell>
                    <TableCell>{rec.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.impact} 
                        size="small"
                        color={rec.impact === 'High' ? 'error' : rec.impact === 'Medium' ? 'warning' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.status} 
                        size="small"
                        color={rec.status === 'APPLIED' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {rec.status !== 'APPLIED' && (
                        <Button size="small" variant="text">Apply</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const AdGroupsTab = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Ad Groups</Typography>
        <Button variant="contained" size="small">Add Ad Group</Button>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Group Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Impressions</TableCell>
              <TableCell align="right">Clicks</TableCell>
              <TableCell align="right">Conversions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaign.adGroups.map((adGroup) => (
              <TableRow key={adGroup.id}>
                <TableCell>{adGroup.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={adGroup.status === 'ENABLED' ? 'Active' : 'Paused'} 
                    color={adGroup.status === 'ENABLED' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{adGroup.impressions.toLocaleString()}</TableCell>
                <TableCell align="right">{adGroup.clicks.toLocaleString()}</TableCell>
                <TableCell align="right">{adGroup.conversions}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<Edit />}>Edit</Button>
                  {adGroup.status === 'ENABLED' ? (
                    <Button size="small" startIcon={<Pause />}>Pause</Button>
                  ) : (
                    <Button size="small" startIcon={<PlayArrow />}>Enable</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const SettingsTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Campaign Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This section will contain editable campaign settings.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<Edit />}>Edit Campaign</Button>
        {campaign.status === 'ENABLED' ? (
          <Button variant="outlined" startIcon={<Pause />}>Pause Campaign</Button>
        ) : (
          <Button variant="outlined" startIcon={<PlayArrow />}>Enable Campaign</Button>
        )}
        <Button variant="outlined" color="error" startIcon={<Report />}>Issues</Button>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CampaignIcon color="primary" />
            <Typography variant="h4" component="h1">
              {campaign.name}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Campaign ID: {campaign.id}
          </Typography>
        </Box>
        
        <Box>
          <Chip 
            label={`Daily Spend: $${campaign.dailySpend.toFixed(2)}`}
            variant="outlined"
            color="primary"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={campaign.status === 'ENABLED' ? 'Active' : 'Paused'} 
            color={campaign.status === 'ENABLED' ? 'success' : 'default'}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Ad Groups" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {tabValue === 0 && <OverviewTab />}
      {tabValue === 1 && <AdGroupsTab />}
      {tabValue === 2 && <SettingsTab />}
    </Box>
  );
};

export default CampaignDetails; 