import axios from 'axios';

// Create an Axios instance with default configs
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          
          const { access_token } = response.data;
          
          // Save new token
          localStorage.setItem('authToken', access_token);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API service methods

// Authentication
const auth = {
  login: (loginData) => api.post('/auth/login', loginData),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
};

// Google Ads Campaigns
const campaigns = {
  getAllCampaigns: (accountId) => api.get(`/campaigns?account_id=${accountId}`),
  getCampaign: (campaignId) => api.get(`/campaigns/${campaignId}`),
  createCampaign: (campaignData) => api.post('/campaigns', campaignData),
  updateCampaign: (campaignId, campaignData) => api.put(`/campaigns/${campaignId}`, campaignData),
  deleteCampaign: (campaignId) => api.delete(`/campaigns/${campaignId}`),
  pauseCampaign: (campaignId) => api.put(`/campaigns/${campaignId}/pause`),
  enableCampaign: (campaignId) => api.put(`/campaigns/${campaignId}/enable`),
};

// E-commerce and Shopping
const ecommerce = {
  getPerformance: (accountId) => api.get(`/ecommerce/performance?account_id=${accountId}`),
  getProducts: (accountId) => api.get(`/ecommerce/products?account_id=${accountId}`),
  createShoppingCampaign: (campaignData) => api.post('/ecommerce/shopping-campaigns', campaignData),
  createPerformanceMaxCampaign: (campaignData) => api.post('/ecommerce/pmax-campaigns', campaignData),
};

// Merchant Center
const merchant = {
  getAccounts: () => api.get('/merchants'),
  getAccountSummary: (merchantId) => api.get(`/merchants/${merchantId}`),
  getFeeds: (merchantId) => api.get(`/merchants/${merchantId}/feeds`),
  getProducts: (merchantId, page = 1, limit = 50, status = null) => {
    let url = `/merchants/${merchantId}/products?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  getIssues: (merchantId) => api.get(`/merchants/${merchantId}/issues`),
  uploadFeed: (merchantId, formData) => api.post(`/merchants/${merchantId}/feeds/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Dashboard and analytics
const dashboard = {
  getSummary: (accountId) => api.get(`/dashboard/summary?account_id=${accountId}`),
  getPerformanceMetrics: (accountId, dateRange) => 
    api.get(`/dashboard/performance?account_id=${accountId}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`),
  getTopPerformers: (accountId, metric) => api.get(`/dashboard/top-performers?account_id=${accountId}&metric=${metric}`),
};

// AI Optimization
const optimization = {
  getSuggestions: (accountId) => api.get(`/optimization/suggestions?account_id=${accountId}`),
  applySuggestion: (suggestionId) => api.post(`/optimization/suggestions/${suggestionId}/apply`),
  dismissSuggestion: (suggestionId) => api.post(`/optimization/suggestions/${suggestionId}/dismiss`),
  generateAdSuggestions: (campaignId) => api.get(`/optimization/ads/suggestions?campaign_id=${campaignId}`),
};

// Export API service
export default {
  ...api,
  auth,
  campaigns,
  ecommerce,
  merchant,
  dashboard,
  optimization,
}; 