import React, { useState } from 'react';
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
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Autocomplete
} from '@mui/material';
import { 
  Bolt as PerfMaxIcon,
  ArrowBack,
  ArrowForward,
  Check,
  Save,
  AddPhotoAlternate,
  Delete,
  CloudUpload
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PerformanceMaxCreate = () => {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [merchantAccounts, setMerchantAccounts] = useState([
    { id: 'merchant1', name: 'Main Store', domain: 'yourstore.com' },
    { id: 'merchant2', name: 'Seasonal Store', domain: 'seasonalproducts.com' }
  ]);
  
  // Sample conversion goals
  const conversionActions = [
    { id: 'conv1', name: 'Purchase', category: 'PURCHASE', value: true, default: true },
    { id: 'conv2', name: 'Add to cart', category: 'ADD_TO_CART', value: false, default: false },
    { id: 'conv3', name: 'Begin checkout', category: 'BEGIN_CHECKOUT', value: false, default: false },
    { id: 'conv4', name: 'Newsletter signup', category: 'SIGNUP', value: false, default: false },
  ];
  
  // Default assets for demo purposes
  const defaultAssets = {
    images: [
      { id: 'img1', type: 'MARKETING', name: 'Product Lifestyle', url: 'https://via.placeholder.com/800x600' },
      { id: 'img2', type: 'PRODUCT', name: 'Product Catalog', url: 'https://via.placeholder.com/600x600' },
    ],
    logos: [
      { id: 'logo1', type: 'LOGO', name: 'Company Logo', url: 'https://via.placeholder.com/300x100' },
    ],
    videos: [],
    headlines: [
      { id: 'h1', text: 'Shop our new collection' },
      { id: 'h2', text: 'Free shipping on all orders' },
      { id: 'h3', text: 'High-quality products for less' },
    ],
    descriptions: [
      { id: 'd1', text: 'Find the perfect items for your home with our curated selection of premium products.' },
      { id: 'd2', text: 'Shop now and get 10% off your first order. Limited time offer!' },
    ],
  };
  
  const [formData, setFormData] = useState({
    // Basic campaign settings
    campaignName: '',
    merchantAccount: '',
    budget: 50,
    bidStrategy: 'MAXIMIZE_CONVERSION_VALUE',
    targetRoas: 400, // 400% = 4:1 ROAS
    
    // Final URL and tracking
    finalUrl: 'https://www.example.com/shop',
    trackingTemplate: '',
    
    // Geographic targeting
    countries: ['United States'],
    languages: ['en'],
    
    // Conversion settings
    conversionGoals: ['conv1'], // Default to Purchase
    
    // Assets (text, images, videos)
    assets: defaultAssets,
    
    // Audience signals
    audiences: {
      interests: [],
      demographics: [],
      remarketing: ['Website visitors - Last 30 days'],
    },
    
    // Additional settings
    finalUrlSuffix: '',
    createAssetGroup: true,
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
      if (!formData.finalUrl) newErrors.finalUrl = 'Final URL is required';
    }
    
    if (step === 1) {
      if (formData.countries.length === 0) newErrors.countries = 'At least one country is required';
      if (formData.conversionGoals.length === 0) newErrors.conversionGoals = 'At least one conversion goal is required';
    }
    
    if (step === 2) {
      const { assets } = formData;
      if (assets.headlines.length < 3) newErrors.headlines = 'At least 3 headlines are required';
      if (assets.descriptions.length < 2) newErrors.descriptions = 'At least 2 descriptions are required';
      if (assets.images.length < 1) newErrors.images = 'At least 1 image is required';
      if (assets.logos.length < 1) newErrors.logos = 'At least 1 logo is required';
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
  
  const handleArrayChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleMultiSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Functions to handle asset changes
  const addAsset = (assetType, asset) => {
    setFormData({
      ...formData,
      assets: {
        ...formData.assets,
        [assetType]: [...formData.assets[assetType], {
          id: `${assetType}${formData.assets[assetType].length + 1}`,
          ...asset
        }]
      }
    });
  };
  
  const removeAsset = (assetType, assetId) => {
    setFormData({
      ...formData,
      assets: {
        ...formData.assets,
        [assetType]: formData.assets[assetType].filter(a => a.id !== assetId)
      }
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
      //   type: 'PERFORMANCE_MAX'
      // });
      
      // Simulate success after 1.5 seconds
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to the campaigns list or campaign details
        navigate('/dashboard', { 
          state: { successMessage: `Performance Max campaign "${formData.campaignName}" created successfully!` }
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
  
  // Steps for the performance max campaign creation process
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
                placeholder="e.g., E-commerce Performance Max"
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
                </Select>
                <FormHelperText>
                  {formData.bidStrategy === 'MAXIMIZE_CONVERSION_VALUE' ? 
                    'Optimizes for highest conversion value within your budget (Recommended for e-commerce)' :
                    'Optimizes for highest number of conversions within your budget'}
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Landing Page URL
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Final URL"
                name="finalUrl"
                value={formData.finalUrl}
                onChange={handleChange}
                error={!!errors.finalUrl}
                helperText={errors.finalUrl || "Your store or product category URL"}
                placeholder="https://www.example.com/shop"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tracking Template (Optional)"
                name="trackingTemplate"
                value={formData.trackingTemplate}
                onChange={handleChange}
                helperText="URL template for 3rd party tracking (leave empty if not using)"
                placeholder="{lpurl}?utm_source=google&utm_medium=pmax&utm_campaign={campaignid}"
              />
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Targeting & Conversion Goals',
      content: (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Geographic Targeting
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
            Conversion Goals
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Select the conversion actions you want to optimize for in this campaign.
          </Alert>
          
          <Box sx={{ ml: 2 }}>
            {conversionActions.map((action) => (
              <FormControlLabel
                key={action.id}
                control={
                  <Checkbox
                    checked={formData.conversionGoals.includes(action.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleArrayChange('conversionGoals', [...formData.conversionGoals, action.id]);
                      } else {
                        handleArrayChange('conversionGoals', 
                          formData.conversionGoals.filter(id => id !== action.id)
                        );
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">{action.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.category} {action.value ? '(with value)' : '(without value)'}
                      {action.default && ' • Default'}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Audience Signals
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Audience signals help guide Performance Max campaigns, especially in the learning phase.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.audiences.remarketing.includes('Website visitors - Last 30 days')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: [...formData.audiences.remarketing, 'Website visitors - Last 30 days']
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: formData.audiences.remarketing.filter(
                              item => item !== 'Website visitors - Last 30 days'
                            )
                          }
                        });
                      }
                    }}
                  />
                }
                label="Website visitors - Last 30 days (Recommended)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.audiences.remarketing.includes('Cart abandoners - Last 7 days')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: [...formData.audiences.remarketing, 'Cart abandoners - Last 7 days']
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: formData.audiences.remarketing.filter(
                              item => item !== 'Cart abandoners - Last 7 days'
                            )
                          }
                        });
                      }
                    }}
                  />
                }
                label="Cart abandoners - Last 7 days"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.audiences.remarketing.includes('Past purchasers - Last 90 days')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: [...formData.audiences.remarketing, 'Past purchasers - Last 90 days']
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          audiences: {
                            ...formData.audiences,
                            remarketing: formData.audiences.remarketing.filter(
                              item => item !== 'Past purchasers - Last 90 days'
                            )
                          }
                        });
                      }
                    }}
                  />
                }
                label="Past purchasers - Last 90 days"
              />
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Asset Group',
      content: (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Headlines
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add at least 3 headlines (up to 30 characters each).
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {formData.assets.headlines.map((headline, index) => (
              <Grid item xs={12} key={headline.id}>
                <TextField
                  fullWidth
                  label={`Headline ${index + 1}`}
                  value={headline.text}
                  onChange={(e) => {
                    const newHeadlines = [...formData.assets.headlines];
                    newHeadlines[index].text = e.target.value;
                    setFormData({
                      ...formData,
                      assets: {
                        ...formData.assets,
                        headlines: newHeadlines
                      }
                    });
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => removeAsset('headlines', headline.id)}
                          edge="end"
                          disabled={formData.assets.headlines.length <= 3}
                        >
                          <Delete />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => addAsset('headlines', { text: '' })}
              >
                Add Headline
              </Button>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom>
            Descriptions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add at least 2 descriptions (up to 90 characters each).
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {formData.assets.descriptions.map((description, index) => (
              <Grid item xs={12} key={description.id}>
                <TextField
                  fullWidth
                  label={`Description ${index + 1}`}
                  value={description.text}
                  onChange={(e) => {
                    const newDescriptions = [...formData.assets.descriptions];
                    newDescriptions[index].text = e.target.value;
                    setFormData({
                      ...formData,
                      assets: {
                        ...formData.assets,
                        descriptions: newDescriptions
                      }
                    });
                  }}
                  multiline
                  rows={2}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => removeAsset('descriptions', description.id)}
                          edge="end"
                          disabled={formData.assets.descriptions.length <= 2}
                        >
                          <Delete />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => addAsset('descriptions', { text: '' })}
              >
                Add Description
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Images
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload at least 1 image for your ads. Recommended size: 1200x628 pixels.
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {formData.assets.images.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={image.url}
                    alt={image.name}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2">{image.name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => removeAsset('images', image.id)}
                        disabled={formData.assets.images.length <= 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'action.hover',
                  cursor: 'pointer'
                }}
                onClick={() => addAsset('images', { 
                  type: 'MARKETING', 
                  name: 'New Image', 
                  url: 'https://via.placeholder.com/800x450' 
                })}
              >
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Upload Image
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom>
            Logo
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload at least 1 logo for your ads. Recommended size: 1200x1200 pixels (square).
          </Typography>
          
          <Grid container spacing={2}>
            {formData.assets.logos.map((logo) => (
              <Grid item xs={12} sm={6} md={3} key={logo.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="100"
                    image={logo.url}
                    alt={logo.name}
                    sx={{ objectFit: 'contain', p: 2 }}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2">{logo.name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => removeAsset('logos', logo.id)}
                        disabled={formData.assets.logos.length <= 1}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'action.hover',
                  cursor: 'pointer'
                }}
                onClick={() => addAsset('logos', { 
                  type: 'LOGO', 
                  name: 'New Logo', 
                  url: 'https://via.placeholder.com/300x300' 
                })}
              >
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <AddPhotoAlternate sx={{ fontSize: 40, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Upload Logo
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 4 }}>
            Note: In a real implementation, you would be able to upload actual images. This demo uses placeholder images.
          </Alert>
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
                  Final URL
                </Typography>
                <Typography variant="body1">
                  {formData.finalUrl}
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
                  Conversion Goals
                </Typography>
                <Typography variant="body1">
                  {formData.conversionGoals.map(id => 
                    conversionActions.find(action => action.id === id)?.name
                  ).filter(Boolean).join(', ')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Audience Signals
                </Typography>
                <Typography variant="body1">
                  {formData.audiences.remarketing.join(', ') || 'None'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2">
                  Assets Summary
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Headlines
                </Typography>
                <Typography variant="body1">
                  {formData.assets.headlines.length} headlines
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Descriptions
                </Typography>
                <Typography variant="body1">
                  {formData.assets.descriptions.length} descriptions
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Images
                </Typography>
                <Typography variant="body1">
                  {formData.assets.images.length} images
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Logos
                </Typography>
                <Typography variant="body1">
                  {formData.assets.logos.length} logos
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
            {isLoading ? 'Creating Campaign...' : 'Create Performance Max Campaign'}
          </Button>
        </Box>
      )
    }
  ];
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <PerfMaxIcon sx={{ mr: 1 }} />
        Create Performance Max Campaign
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

export default PerformanceMaxCreate; 