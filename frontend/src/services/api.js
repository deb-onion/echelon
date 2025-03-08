import axios from 'axios';

// Create a base instance of axios with custom settings
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout after 10 seconds
  timeout: 10000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('echelon_token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and other auth data
      localStorage.removeItem('echelon_token');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods for different endpoints
const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    checkStatus: () => api.get('/auth/status'),
  },
  
  // Account endpoints
  accounts: {
    getAll: () => api.get('/accounts'),
    getById: (id) => api.get(`/accounts/${id}`),
  },
  
  // Campaign endpoints
  campaigns: {
    getAll: (accountId) => api.get(`/accounts/${accountId}/campaigns`),
    getById: (accountId, campaignId) => api.get(`/accounts/${accountId}/campaigns/${campaignId}`),
    create: (accountId, campaignData) => api.post(`/accounts/${accountId}/campaigns`, campaignData),
    update: (accountId, campaignId, campaignData) => api.put(`/accounts/${accountId}/campaigns/${campaignId}`, campaignData),
    delete: (accountId, campaignId) => api.delete(`/accounts/${accountId}/campaigns/${campaignId}`),
    updateStatus: (accountId, campaignId, status) => api.patch(`/accounts/${accountId}/campaigns/${campaignId}/status`, { status }),
  },
  
  // Ad groups endpoints
  adGroups: {
    getAll: (accountId, campaignId) => api.get(`/accounts/${accountId}/campaigns/${campaignId}/ad_groups`),
    getById: (accountId, campaignId, adGroupId) => api.get(`/accounts/${accountId}/campaigns/${campaignId}/ad_groups/${adGroupId}`),
    create: (accountId, campaignId, adGroupData) => api.post(`/accounts/${accountId}/campaigns/${campaignId}/ad_groups`, adGroupData),
    update: (accountId, campaignId, adGroupId, adGroupData) => api.put(`/accounts/${accountId}/campaigns/${campaignId}/ad_groups/${adGroupId}`, adGroupData),
    delete: (accountId, campaignId, adGroupId) => api.delete(`/accounts/${accountId}/campaigns/${campaignId}/ad_groups/${adGroupId}`),
  },
  
  // Recommendations endpoints
  recommendations: {
    getForAccount: (accountId) => api.get(`/accounts/${accountId}/recommendations`),
    getForCampaign: (accountId, campaignId) => api.get(`/accounts/${accountId}/campaigns/${campaignId}/recommendations`),
    apply: (accountId, recommendationIds) => api.post(`/accounts/${accountId}/recommendations/apply`, { recommendation_ids: recommendationIds }),
    dismiss: (accountId, recommendationIds) => api.post(`/accounts/${accountId}/recommendations/dismiss`, { recommendation_ids: recommendationIds }),
  },
  
  // Performance data endpoints
  performance: {
    getAccountSummary: (accountId, dateRange) => api.get(`/accounts/${accountId}/performance`, { params: dateRange }),
    getCampaignPerformance: (accountId, campaignId, dateRange) => api.get(`/accounts/${accountId}/campaigns/${campaignId}/performance`, { params: dateRange }),
  },
};

export default apiService; 