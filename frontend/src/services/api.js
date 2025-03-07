import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication
export const authApi = {
  // Get available accounts
  getAccounts: () => api.get('/accounts'),
  
  // Check authentication status
  checkAuth: () => api.get('/auth/status'),
  
  // Sign out
  signOut: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selected_account');
    return Promise.resolve();
  },
};

// Campaign management
export const campaignApi = {
  // Get all campaigns for an account
  getCampaigns: (accountId) => api.get(`/campaigns?account_id=${accountId}`),
  
  // Get details for a specific campaign
  getCampaignDetails: (accountId, campaignId) => 
    api.get(`/campaigns/${campaignId}?account_id=${accountId}`),
};

// Recommendations
export const recommendationsApi = {
  // Get account-wide recommendations
  getAccountRecommendations: (accountId) => 
    api.get(`/recommendations?account_id=${accountId}`),
  
  // Get recommendations for a specific campaign
  getCampaignRecommendations: (accountId, campaignId) => 
    api.get(`/recommendations/${campaignId}?account_id=${accountId}`),
  
  // Apply recommendations
  applyRecommendations: (accountId, campaignIds) => 
    api.post('/apply-recommendations', { account_id: accountId, campaigns: campaignIds }),
};

export default {
  auth: authApi,
  campaigns: campaignApi,
  recommendations: recommendationsApi,
}; 