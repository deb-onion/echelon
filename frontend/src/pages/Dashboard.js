import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Paper,
  Chip,
  CircularProgress,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { 
  TrendingUp, 
  AttachMoney, 
  TrendingDown, 
  Check, 
  Warning,
  Timeline,
  Insights,
  ShoppingBag
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { alpha } from '@mui/material/styles';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  // Simulated data - replace with actual API calls in production
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call like:
        // const response = await api.get(`/accounts/${account}/dashboard`);
        // setDashboardData(response.data);
        
        // Simulated data
        setTimeout(() => {
          setDashboardData({
            accountHealth: 82,
            totalCampaigns: 12,
            activeCampaigns: 8,
            pendingRecommendations: 5,
            totalSpend: 12450.32,
            totalConversions: 345,
            costPerConversion: 36.09,
            campaignsWithIssues: 2,
            // E-commerce specific metrics
            revenue: 62500.50,
            roas: 501.99, // 5.02x ROAS
            avgOrderValue: 181.16,
            conversionRate: 3.94,
            topProducts: [
              { id: 'p1', name: 'Premium Headphones', revenue: 12350.75, roas: 650, units: 65 },
              { id: 'p2', name: 'Wireless Earbuds', revenue: 8750.25, roas: 580, units: 125 },
              { id: 'p3', name: 'Smart Watch', revenue: 7680.50, roas: 480, units: 32 },
              { id: 'p4', name: 'Fitness Tracker', revenue: 6540.20, roas: 430, units: 59 },
            ],
            campaignPerformance: [
              { id: 'c1', name: 'Shopping - Main Products', type: 'SHOPPING', spend: 4580.50, revenue: 25680.75, roas: 560 },
              { id: 'c2', name: 'Performance Max - Store', type: 'PERFORMANCE_MAX', spend: 3750.25, revenue: 18950.50, roas: 505 },
              { id: 'c3', name: 'Search - Brand Terms', type: 'SEARCH', spend: 1240.80, revenue: 9870.25, roas: 795 },
              { id: 'c4', name: 'Dynamic Remarketing', type: 'DISPLAY', spend: 2879.77, revenue: 7999.00, roas: 278 },
            ]
          });
          
          setPerformanceData({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
              {
                label: 'Conversions',
                data: [42, 58, 65, 61, 78, 92, 85],
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main,
              },
              {
                label: 'Cost per Conversion',
                data: [48, 42, 38, 41, 35, 32, 36],
                borderColor: theme.palette.secondary.main,
                backgroundColor: theme.palette.secondary.main,
              },
            ],
          });
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (account) {
      fetchDashboardData();
    }
  }, [account, theme.palette.primary.main, theme.palette.secondary.main]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const healthChartData = {
    labels: ['Health Score', 'Remaining'],
    datasets: [
      {
        data: [dashboardData.accountHealth, 100 - dashboardData.accountHealth],
        backgroundColor: [
          dashboardData.accountHealth > 80 ? '#4caf50' : dashboardData.accountHealth > 60 ? '#ff9800' : '#f44336',
          '#e0e0e0'
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    cutout: '75%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Campaign Performance',
      },
    },
  };

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        E-commerce Dashboard
      </Typography>
      
      {/* ROAS and Revenue Section */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: theme.palette.primary.dark, color: 'white' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                ROAS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {(dashboardData.roas / 100).toFixed(2)}x
              </Typography>
              <Typography variant="body2">
                Return on Ad Spend
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Revenue
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                ${dashboardData.revenue.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Total Revenue
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                AOV
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                ${dashboardData.avgOrderValue.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Average Order Value
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {dashboardData.conversionRate}%
              </Typography>
              <Typography variant="body2">
                Store Conversion Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Health Score and Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', textAlign: 'center', position: 'relative' }}>
            <Typography variant="h6" gutterBottom>
              Account Health
            </Typography>
            <Box sx={{ height: 180, position: 'relative', mb: 2 }}>
              <Doughnut data={healthChartData} options={chartOptions} />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" color="text.primary">
                  {dashboardData.accountHealth}%
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Insights />}
              onClick={() => navigate('/recommendations')}
            >
              View Recommendations
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Total Spend
                    </Typography>
                    <AttachMoney color="primary" />
                  </Box>
                  <Typography variant="h5" component="div" sx={{ mt: 1, mb: 1 }}>
                    ${dashboardData.totalSpend.toLocaleString()}
                  </Typography>
                  <Chip 
                    icon={<TrendingUp />} 
                    label="8% vs Last Month" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Conversions
                    </Typography>
                    <Check color="primary" />
                  </Box>
                  <Typography variant="h5" component="div" sx={{ mt: 1, mb: 1 }}>
                    {dashboardData.totalConversions}
                  </Typography>
                  <Chip 
                    icon={<TrendingUp />} 
                    label="12% vs Last Month" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Cost Per Conversion
                    </Typography>
                    <AttachMoney color="primary" />
                  </Box>
                  <Typography variant="h5" component="div" sx={{ mt: 1, mb: 1 }}>
                    ${dashboardData.costPerConversion.toFixed(2)}
                  </Typography>
                  <Chip 
                    icon={<TrendingDown />} 
                    label="5% vs Last Month" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Campaigns
                    </Typography>
                    <Timeline color="primary" />
                  </Box>
                  <Typography variant="h5" component="div" sx={{ mt: 1, mb: 1 }}>
                    {dashboardData.activeCampaigns} / {dashboardData.totalCampaigns}
                  </Typography>
                  {dashboardData.campaignsWithIssues > 0 ? (
                    <Chip 
                      icon={<Warning />} 
                      label={`${dashboardData.campaignsWithIssues} with issues`} 
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<Check />} 
                      label="All campaigns healthy" 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Campaign Performance Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Performance by Type
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Spend</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">ROAS</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.campaignPerformance.map((campaign) => (
                    <TableRow key={campaign.id} 
                      sx={{
                        backgroundColor: campaign.roas < 200 ? alpha(theme.palette.error.light, 0.1) :
                                        campaign.roas > 600 ? alpha(theme.palette.success.light, 0.1) : 'inherit'
                      }}
                    >
                      <TableCell>{campaign.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.type.replace('_', ' ')} 
                          size="small"
                          color={
                            campaign.type === 'SHOPPING' ? 'primary' :
                            campaign.type === 'PERFORMANCE_MAX' ? 'secondary' :
                            campaign.type === 'SEARCH' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">${campaign.spend.toLocaleString()}</TableCell>
                      <TableCell align="right">${campaign.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: campaign.roas < 200 ? theme.palette.error.main :
                                  campaign.roas > 600 ? theme.palette.success.main : 'inherit',
                            fontWeight: 'medium'
                          }}
                        >
                          {(campaign.roas / 100).toFixed(2)}x
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="text" onClick={() => navigate(`/campaign/${campaign.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Top Products Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Products
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">ROAS</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell align="right">${product.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">{(product.roas / 100).toFixed(2)}x</TableCell>
                      <TableCell align="right">{product.units}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="text">
                          Optimize
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Performance Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Performance Trends
        </Typography>
        <Box sx={{ height: 300 }}>
          {performanceData && (
            <Line options={lineChartOptions} data={performanceData} />
          )}
        </Box>
      </Paper>
      
      {/* Action Buttons */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/campaigns')}
          >
            All Campaigns
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            onClick={() => navigate('/recommendations')}
          >
            Optimization Suggestions
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => navigate('/new-shopping-campaign')}
          >
            New Shopping Campaign
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button 
            fullWidth 
            variant="contained" 
            color="secondary" 
            size="large"
            onClick={() => navigate('/new-performance-max')}
          >
            New Perf Max Campaign
          </Button>
        </Grid>
      </Grid>
      
      {/* Merchant Center Quick Access */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="text" 
          color="primary"
          startIcon={<ShoppingBag />}
          onClick={() => navigate('/merchant-feed')}
          sx={{ '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}
        >
          Manage Merchant Center Feeds
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard; 