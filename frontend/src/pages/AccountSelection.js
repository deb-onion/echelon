import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  CircularProgress,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  SmartToy as AIIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero-image.jpg'; // You'll need to add this file

const AccountSelection = ({ onSelectAccount }) => {
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulated account data - replace with API call in production
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          const demoAccounts = [
            { id: '1234567890', name: 'Main E-commerce Store', status: 'active', campaigns: 8, spend: 4580.25 },
            { id: '2345678901', name: 'Fashion Boutique', status: 'active', campaigns: 5, spend: 2320.75 },
            { id: '3456789012', name: 'Tech Gadgets Shop', status: 'active', campaigns: 7, spend: 5650.50 },
            { id: '4567890123', name: 'Home Decor Products', status: 'paused', campaigns: 3, spend: 1250.00 },
            { id: '5678901234', name: 'Fitness Equipment Store', status: 'active', campaigns: 6, spend: 3450.80 },
            { id: '6789012345', name: 'Beauty Products', status: 'active', campaigns: 4, spend: 1875.20 }
          ];
          setAccounts(demoAccounts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.id.includes(searchTerm)
  );

  const handleAccountSelect = (accountId) => {
    if (onSelectAccount) {
      onSelectAccount(accountId);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          backgroundColor: theme.palette.primary.main,
          backgroundImage: `linear-gradient(${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.8)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Echelon
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 300 }}>
              Advanced Google Ads Management System with AI-Driven Optimization
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5, 
                backgroundColor: 'white', 
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.9)
                }
              }}
              onClick={() => document.getElementById('accounts-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Select Account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 6, fontWeight: 600 }}>
          Powerful Features for Google Ads Management
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', height: '100%', border: `1px solid ${theme.palette.divider}` }}>
              <AIIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI-Powered Optimization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Machine learning models analyze your campaign performance and provide smart recommendations.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', height: '100%', border: `1px solid ${theme.palette.divider}` }}>
              <DashboardIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Comprehensive Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visual insights into campaign performance, spend tracking, and conversion metrics.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', height: '100%', border: `1px solid ${theme.palette.divider}` }}>
              <AnalyticsIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deep dive into performance data with customizable reports and actionable insights.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', height: '100%', border: `1px solid ${theme.palette.divider}` }}>
              <SpeedIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-time Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stay on top of your campaigns with real-time performance tracking and alerts.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Account Selection Section */}
      <Box 
        id="accounts-section"
        sx={{ 
          py: 6, 
          backgroundColor: theme.palette.grey[50]
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 4 }}>
            Select Your Account
          </Typography>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by account name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
            />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredAccounts.length > 0 ? (
              <Grid container spacing={3}>
                {filteredAccounts.map((account) => (
                  <Grid item xs={12} sm={6} key={account.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        border: account.status === 'paused' ? `1px solid ${theme.palette.warning.main}` : 'none'
                      }}
                    >
                      <CardActionArea 
                        onClick={() => handleAccountSelect(account.id)}
                        sx={{ height: '100%' }}
                      >
                        <CardContent>
                          <Typography variant="h6" component="div" gutterBottom noWrap>
                            {account.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            ID: {account.id}
                          </Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                            <Typography variant="body2">
                              Campaigns: {account.campaigns}
                            </Typography>
                            <Typography variant="body2">
                              Spend: ${account.spend.toLocaleString()}
                            </Typography>
                          </Box>
                          {account.status === 'paused' && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.warning.main,
                                mt: 1,
                                fontWeight: 'medium'
                              }}
                            >
                              Account Paused
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">No accounts found matching "{searchTerm}"</Typography>
                <Button 
                  variant="text" 
                  color="primary" 
                  onClick={() => setSearchTerm('')}
                  sx={{ mt: 2 }}
                >
                  Clear Search
                </Button>
              </Box>
            )}
          </Paper>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't see your account?
            </Typography>
            <Button variant="outlined" color="primary">
              Connect a New Account
            </Button>
          </Box>
        </Container>
      </Box>
      
      {/* Footer */}
      <Box sx={{ py: 4, backgroundColor: theme.palette.primary.dark, color: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © {new Date().getFullYear()} Echelon Google Ads Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AccountSelection; 