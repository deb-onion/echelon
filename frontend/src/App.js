import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Dashboard from './pages/Dashboard';
import CampaignDetails from './pages/CampaignDetails';
import Recommendations from './pages/Recommendations';
import AccountSelection from './pages/AccountSelection';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';

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
    return <Navigate to="/" replace />;
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
      <Route path="/" element={<AccountSelection onSelectAccount={handleAccountSelect} />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/campaign/:campaignId" element={
        <ProtectedRoute>
          <Layout>
            <CampaignDetails />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/recommendations" element={
        <ProtectedRoute>
          <Layout>
            <Recommendations />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 