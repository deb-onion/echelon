import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Alert,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import { 
  ShoppingCart as ShoppingIcon,
  ArrowBack,
  ArrowForward,
  Check,
  Save
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ShoppingCampaignCreate = () => {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [merchantAccounts, setMerchantAccounts] = useState([
    { id: 'merchant1', name: 'Main Store', domain: 'yourstore.com' },
    { id: 'merchant2', name: 'Seasonal Store', domain: 'seasonalproducts.com' }
  ]);
  
  const [formData, setFormData] = useState({
    // Basic campaign settings
    campaignName: '',
    merchantAccount: '',
    budget: 50,
    bidStrategy: 'MAXIMIZE_CONVERSION_VALUE',
    targetRoas: 400, // 400% = 4:1 ROAS
    
    // Product selection
    productSelection: 'ALL_PRODUCTS',
    productGroups: [],
    excludedProductGroups: [],
    
    // Targeting
    countries: ['United States'],
    languages: ['en'],
    inventoryFilter: true, // Only show products that are in-stock
    
    // Network settings
    includeGoogle: true,
    includeSearch: true,
    includeYouTube: false,
    includeDisplay: false,
    
    // Additional settings
    enableLocalInventory: false,
    campaignPriority: 'MEDIUM', // LOW, MEDIUM, HIGH
  });
  
  const [errors, setErrors] = useState({});
  
  // Form validation
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.campaignName) newErrors.campaignName = 'Campaign name is required';
      if (!formData.merchantAccount) newErrors.merchantAccount = 'Merchant account is required';
      if (formData.budget <= 0) newErrors.budget = 'Budget must be greater than 0';
      if (formData.bidStrategy === 'MAXIMIZE_CONVERSION_VALUE' && 
          (formData.targetRoas < 100 || formData.targetRoas > 10000)) {
        newErrors.targetRoas = 'Target ROAS must be between 100% and 10,000%';
      }
    }
    
    if (step === 1) {
      if (formData.countries.length === 0) newErrors.countries = 'At least one country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleMultiSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setIsLoading(true);
    try {
      // Simulate API call to create campaign
      // In a real implementation, this would call the backend
      // const response = await api.campaigns.create(account, {
      //   ...formData,
      //   type: 'SHOPPING'
      // });
      
      // Simulate success after 1.5 seconds
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to the campaigns list or campaign details
        navigate('/dashboard', { 
          state: { successMessage: `Shopping campaign "${formData.campaignName}" created successfully!` }
        });
      }, 1500);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setIsLoading(false);
    }
  };
  
  // Available countries for targeting
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
  ];
  
  // Available languages for targeting
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
  ];
  
  // Steps for the shopping campaign creation process
  const steps = [
    {
      label: 'Basic Settings',
      content: (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                name="campaignName"
                value={formData.campaignName}
                onChange={handleChange}
                error={!!errors.campaignName}
                helperText={errors.campaignName}
                placeholder="e.g., Summer Collection - Shopping Campaign"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.merchantAccount}>
                <InputLabel>Merchant Center Account</InputLabel>
                <Select
                  name="merchantAccount"
                  value={formData.merchantAccount}
                  onChange={handleChange}
                  label="Merchant Center Account"
                >
                  {merchantAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.domain})
                    </MenuItem>
                  ))}
                </Select>
                {errors.merchantAccount && <FormHelperText>{errors.merchantAccount}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Daily Budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                error={!!errors.budget}
                helperText={errors.budget}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Bidding Strategy</InputLabel>
                <Select
                  name="bidStrategy"
                  value={formData.bidStrategy}
                  onChange={handleChange}
                  label="Bidding Strategy"
                >
                  <MenuItem value="MAXIMIZE_CONVERSION_VALUE">Maximize Conversion Value</MenuItem>
                  <MenuItem value="MAXIMIZE_CONVERSIONS">Maximize Conversions</MenuItem>
                  <MenuItem value="MANUAL_CPC">Manual CPC</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.bidStrategy === 'MAXIMIZE_CONVERSION_VALUE' ? 
                    'Optimizes for highest conversion value within your budget' :
                    formData.bidStrategy === 'MAXIMIZE_CONVERSIONS' ?
                    'Optimizes for highest number of conversions within your budget' :
                    'Manually set your cost-per-click bids'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {formData.bidStrategy === 'MAXIMIZE_CONVERSION_VALUE' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target ROAS"
                  name="targetRoas"
                  type="number"
                  value={formData.targetRoas}
                  onChange={handleChange}
                  error={!!errors.targetRoas}
                  helperText={errors.targetRoas || "Target Return on Ad Spend (400% = 4:1 return)"}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )
    },
    {
      label: 'Product Selection & Targeting',
      content: (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Product Selection
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.productSelection === 'ALL_PRODUCTS'}
                      onChange={() => setFormData({
                        ...formData,
                        productSelection: 'ALL_PRODUCTS'
                      })}
                    />
                  }
                  label="All products (Recommended for new campaigns)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.productSelection === 'SELECTED_PRODUCT_GROUPS'}
                      onChange={() => setFormData({
                        ...formData,
                        productSelection: 'SELECTED_PRODUCT_GROUPS'
                      })}
                    />
                  }
                  label="Selected product groups"
                />
                {formData.productSelection === 'SELECTED_PRODUCT_GROUPS' && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Product group selection will be configured after campaign creation
                  </Alert>
                )}
              </Grid>
            </Grid>
          </FormControl>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Location & Language
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={countries}
                getOptionLabel={(option) => option.name}
                value={countries.filter(country => formData.countries.includes(country.name))}
                onChange={(e, newValue) => handleMultiSelectChange(
                  'countries', 
                  newValue.map(item => item.name)
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Target Countries"
                    error={!!errors.countries}
                    helperText={errors.countries}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.code}
                    />
                  ))
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={languages}
                getOptionLabel={(option) => option.name}
                value={languages.filter(lang => formData.languages.includes(lang.code))}
                onChange={(e, newValue) => handleMultiSelectChange(
                  'languages', 
                  newValue.map(item => item.code)
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Target Languages"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.code}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Inventory Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                name="inventoryFilter"
                checked={formData.inventoryFilter}
                onChange={handleCheckboxChange}
              />
            }
            label="Only show products that are in-stock (Recommended)"
          />
        </Box>
      )
    },
    {
      label: 'Networks & Additional Settings',
      content: (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Networks
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="includeGoogle"
                    checked={formData.includeGoogle}
                    onChange={handleCheckboxChange}
                    disabled
                  />
                }
                label="Google Shopping (Required)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="includeSearch"
                    checked={formData.includeSearch}
                    onChange={handleCheckboxChange}
                  />
                }
                label="Google Search Network"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="includeYouTube"
                    checked={formData.includeYouTube}
                    onChange={handleCheckboxChange}
                  />
                }
                label="YouTube (Shopping ads on YouTube videos)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="includeDisplay"
                    checked={formData.includeDisplay}
                    onChange={handleCheckboxChange}
                  />
                }
                label="Display Network (Shopping ads on partner websites)"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Campaign Priority
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Campaign Priority</InputLabel>
            <Select
              name="campaignPriority"
              value={formData.campaignPriority}
              onChange={handleChange}
              label="Campaign Priority"
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </Select>
            <FormHelperText>
              Determines which campaign should serve when multiple campaigns advertise the same product
            </FormHelperText>
          </FormControl>
          
          <Typography variant="subtitle1" gutterBottom>
            Advanced Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                name="enableLocalInventory"
                checked={formData.enableLocalInventory}
                onChange={handleCheckboxChange}
              />
            }
            label="Enable local inventory ads (for retailers with physical stores)"
          />
          
          <Box sx={{ mt: 4 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              After campaign creation, you can further customize your product groups, create separate ad groups, 
              and set up advanced bidding rules for specific products.
            </Alert>
          </Box>
        </Box>
      )
    },
    {
      label: 'Review & Create',
      content: (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Campaign Summary
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Campaign Name
                </Typography>
                <Typography variant="body1">
                  {formData.campaignName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Merchant Center Account
                </Typography>
                <Typography variant="body1">
                  {merchantAccounts.find(acc => acc.id === formData.merchantAccount)?.name || ''}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Daily Budget
                </Typography>
                <Typography variant="body1">
                  ${formData.budget}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Bidding Strategy
                </Typography>
                <Typography variant="body1">
                  {formData.bidStrategy.replace('_', ' ')}
                  {formData.bidStrategy === 'MAXIMIZE_CONVERSION_VALUE' && 
                    ` (Target ROAS: ${formData.targetRoas}%)`
                  }
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Product Selection
                </Typography>
                <Typography variant="body1">
                  {formData.productSelection === 'ALL_PRODUCTS' ? 
                    'All Products' : 'Selected Product Groups'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Campaign Priority
                </Typography>
                <Typography variant="body1">
                  {formData.campaignPriority}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Target Countries
                </Typography>
                <Typography variant="body1">
                  {formData.countries.join(', ')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Networks
                </Typography>
                <Typography variant="body1">
                  {[
                    formData.includeGoogle && 'Google Shopping',
                    formData.includeSearch && 'Search Network',
                    formData.includeYouTube && 'YouTube',
                    formData.includeDisplay && 'Display Network'
                  ].filter(Boolean).join(', ')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
          >
            {isLoading ? 'Creating Campaign...' : 'Create Shopping Campaign'}
          </Button>
        </Box>
      )
    }
  ];
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <ShoppingIcon sx={{ mr: 1 }} />
        Create Shopping Campaign
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                  >
                    Back
                  </Button>
                  
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Check />}
                    >
                      Create Campaign
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Continue
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Button 
        variant="outlined" 
        onClick={() => navigate('/dashboard')}
        startIcon={<ArrowBack />}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default ShoppingCampaignCreate; 