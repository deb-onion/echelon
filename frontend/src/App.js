import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Dashboard from './pages/Dashboard';
import CampaignDetails from './pages/CampaignDetails';
import Recommendations from './pages/Recommendations';
import AccountSelection from './pages/AccountSelection';
import ShoppingCampaignCreate from './pages/ShoppingCampaignCreate';
import PerformanceMaxCreate from './pages/PerformanceMaxCreate';
import MerchantFeedDashboard from './pages/MerchantFeedDashboard';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppRoutes() {
  const navigate = useNavigate();
  const { setAccount } = useAuth();
  
  // Handle account selection
  const handleAccountSelect = (accountId) => {
    setAccount(accountId);
    navigate('/dashboard');
  };
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<AccountSelection onSelectAccount={handleAccountSelect} />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="campaigns/:campaignId" element={<CampaignDetails />} />
        <Route path="shopping-campaign/create" element={<ShoppingCampaignCreate />} />
        <Route path="pmax-campaign/create" element={<PerformanceMaxCreate />} />
        <Route path="merchant-feed" element={<MerchantFeedDashboard />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 