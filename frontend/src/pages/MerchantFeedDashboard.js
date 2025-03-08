import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ShoppingBag as MerchantIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MerchantFeedDashboard = () => {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [merchantAccounts, setMerchantAccounts] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [feeds, setFeeds] = useState([]);
  const [products, setProducts] = useState([]);
  const [productIssues, setProductIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Fetch merchant accounts
  useEffect(() => {
    const fetchMerchantAccounts = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call
        // const response = await api.merchant.getAccounts(account);
        // setMerchantAccounts(response.data.accounts);
        
        // Simulate API response
        setTimeout(() => {
          const demoAccounts = [
            { 
              id: 'merchant1', 
              name: 'Main E-commerce Store', 
              domain: 'yourstore.com',
              accountStatus: 'ACTIVE',
              totalProducts: 542,
              approvedProducts: 498,
              disapprovedProducts: 32,
              pendingProducts: 12
            },
            { 
              id: 'merchant2', 
              name: 'Seasonal Products Store', 
              domain: 'seasonalproducts.com',
              accountStatus: 'ACTIVE',
              totalProducts: 189,
              approvedProducts: 172,
              disapprovedProducts: 8,
              pendingProducts: 9
            }
          ];
          
          setMerchantAccounts(demoAccounts);
          if (demoAccounts.length > 0) {
            setSelectedMerchantId(demoAccounts[0].id);
            fetchFeedData(demoAccounts[0].id);
          } else {
            setLoading(false);
          }
        }, 1000);
      } catch (error) {
        console.error('Error fetching merchant accounts:', error);
        setLoading(false);
      }
    };
    
    if (account) {
      fetchMerchantAccounts();
    }
  }, [account]);
  
  // Fetch feed data when a merchant account is selected
  const fetchFeedData = async (merchantId) => {
    setLoading(true);
    try {
      // In a real implementation, this would be API calls
      // const feedsResponse = await api.merchant.getFeeds(merchantId);
      // const productsResponse = await api.merchant.getProducts(merchantId);
      // const issuesResponse = await api.merchant.getProductIssues(merchantId);
      
      // Simulate API responses
      setTimeout(() => {
        // Simulated feeds
        const demoFeeds = [
          {
            id: 'feed1',
            name: 'Primary Product Feed',
            feedType: 'PRIMARY',
            fileType: 'CSV',
            lastUploadDate: '2023-07-05T14:30:00Z',
            status: 'PROCESSED',
            itemsTotal: 542,
            itemsProcessed: 542,
            itemsSuccessful: 498,
            itemsWithWarnings: 12,
            itemsWithErrors: 32,
            targetCountries: ['US', 'CA'],
            processingStatus: 'SUCCESS'
          },
          {
            id: 'feed2',
            name: 'Inventory Updates',
            feedType: 'INVENTORY',
            fileType: 'CSV',
            lastUploadDate: '2023-07-06T08:15:00Z',
            status: 'PROCESSED',
            itemsTotal: 542,
            itemsProcessed: 542,
            itemsSuccessful: 540,
            itemsWithWarnings: 2,
            itemsWithErrors: 0,
            targetCountries: ['US', 'CA'],
            processingStatus: 'SUCCESS'
          },
          {
            id: 'feed3',
            name: 'Price Updates',
            feedType: 'PRICE',
            fileType: 'CSV',
            lastUploadDate: '2023-07-06T08:30:00Z',
            status: 'PROCESSED',
            itemsTotal: 542,
            itemsProcessed: 542,
            itemsSuccessful: 542,
            itemsWithWarnings: 0,
            itemsWithErrors: 0,
            targetCountries: ['US', 'CA'],
            processingStatus: 'SUCCESS'
          },
          {
            id: 'feed4',
            name: 'Supplemental Feed',
            feedType: 'SUPPLEMENTAL',
            fileType: 'CSV',
            lastUploadDate: '2023-07-01T10:00:00Z',
            status: 'PROCESSED',
            itemsTotal: 120,
            itemsProcessed: 120,
            itemsSuccessful: 118,
            itemsWithWarnings: 0,
            itemsWithErrors: 2,
            targetCountries: ['US'],
            processingStatus: 'SUCCESS'
          }
        ];
        
        // Simulated product sample
        const demoProducts = [
          {
            id: 'product1',
            title: 'Premium Wireless Headphones',
            link: 'https://www.example.com/headphones',
            price: {
              value: 129.99,
              currency: 'USD'
            },
            availability: 'in stock',
            imageLink: 'https://www.example.com/images/headphones.jpg',
            gtin: '885909456321',
            brand: 'AudioPlus',
            status: 'approved',
            issues: []
          },
          {
            id: 'product2',
            title: 'Ultra HD Smart TV 55"',
            link: 'https://www.example.com/tv',
            price: {
              value: 699.99,
              currency: 'USD'
            },
            availability: 'in stock',
            imageLink: 'https://www.example.com/images/tv.jpg',
            gtin: '885909123456',
            brand: 'VisionTech',
            status: 'approved',
            issues: []
          },
          {
            id: 'product3',
            title: 'Smartphone Charging Cable',
            link: 'https://www.example.com/cable',
            price: {
              value: 12.99,
              currency: 'USD'
            },
            availability: 'in stock',
            imageLink: 'https://www.example.com/images/cable.jpg',
            gtin: '',
            brand: 'PowerCharge',
            status: 'disapproved',
            issues: [
              {
                code: 'missing_gtin',
                severity: 'error',
                resolution: 'Add a valid GTIN'
              }
            ]
          },
          {
            id: 'product4',
            title: 'Bluetooth Portable Speaker',
            link: 'https://www.example.com/speaker',
            price: {
              value: 49.99,
              currency: 'USD'
            },
            availability: 'out of stock',
            imageLink: 'https://www.example.com/images/speaker.jpg',
            gtin: '885909987654',
            brand: 'AudioPlus',
            status: 'disapproved',
            issues: [
              {
                code: 'availability_not_supported',
                severity: 'error',
                resolution: 'Update availability to "in stock" or "preorder"'
              }
            ]
          },
          {
            id: 'product5',
            title: 'Ergonomic Office Chair',
            link: 'https://www.example.com/chair',
            price: {
              value: 249.99,
              currency: 'USD'
            },
            availability: 'in stock',
            imageLink: 'https://www.example.com/images/chair.jpg',
            gtin: '885909556677',
            brand: 'ComfortPlus',
            status: 'pending',
            issues: []
          }
        ];
        
        // Simulated product issues summary
        const demoIssues = [
          {
            code: 'missing_gtin',
            severity: 'error',
            count: 15,
            description: 'Missing GTIN (barcode)',
            resolution: 'Add a valid GTIN/UPC/EAN to affected products',
            affectedSample: ['Smartphone Charging Cable', 'USB Wall Adapter', 'HDMI Cable 6ft']
          },
          {
            code: 'invalid_price',
            severity: 'error',
            count: 8,
            description: 'Price is missing or invalid',
            resolution: 'Update product prices with valid values',
            affectedSample: ['Wireless Mouse', 'Gaming Headset']
          },
          {
            code: 'availability_not_supported',
            severity: 'error',
            count: 9,
            description: 'Availability status not supported',
            resolution: 'Update availability to "in stock" or "preorder"',
            affectedSample: ['Bluetooth Portable Speaker', 'Smart Watch']
          },
          {
            code: 'image_too_small',
            severity: 'warning',
            count: 12,
            description: 'Product image size too small',
            resolution: 'Use higher resolution images (at least 800x800px)',
            affectedSample: ['Phone Case', 'Screen Protector', 'Wireless Earbuds']
          }
        ];
        
        setFeeds(demoFeeds);
        setProducts(demoProducts);
        setProductIssues(demoIssues);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching feed data:', error);
      setLoading(false);
    }
  };
  
  // Handle merchant account change
  const handleMerchantAccountChange = (merchantId) => {
    setSelectedMerchantId(merchantId);
    fetchFeedData(merchantId);
  };
  
  // Handle feed refresh
  const handleRefreshFeed = () => {
    if (selectedMerchantId) {
      fetchFeedData(selectedMerchantId);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle product search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle feed upload dialog
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };
  
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };
  
  // Simulate feed upload
  const handleFeedUpload = () => {
    setUploadLoading(true);
    
    // Simulate API call for upload
    setTimeout(() => {
      setUploadLoading(false);
      setUploadDialogOpen(false);
      
      // Refresh feed data after upload
      fetchFeedData(selectedMerchantId);
    }, 2000);
  };
  
  // Get the selected merchant account
  const selectedMerchant = merchantAccounts.find(m => m.id === selectedMerchantId);
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading && !selectedMerchant) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const calculateApprovalRate = (approved, total) => {
    return total > 0 ? (approved / total) * 100 : 0;
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <MerchantIcon sx={{ mr: 1 }} />
        Merchant Center Feed Management
      </Typography>
      
      {/* Merchant Account Selector */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {merchantAccounts.map((merchant) => (
            <Grid item xs={12} md={6} key={merchant.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: merchant.id === selectedMerchantId ? `2px solid ${merchant.accountStatus === 'ACTIVE' ? '#4caf50' : '#ff9800'}` : 'none',
                  boxShadow: merchant.id === selectedMerchantId ? 3 : 1
                }}
                onClick={() => handleMerchantAccountChange(merchant.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {merchant.name}
                    </Typography>
                    <Chip 
                      label={merchant.accountStatus} 
                      color={merchant.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {merchant.domain}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Products
                        </Typography>
                        <Typography variant="h6">
                          {merchant.totalProducts}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Approval Rate
                        </Typography>
                        <Typography variant="h6">
                          {calculateApprovalRate(merchant.approvedProducts, merchant.totalProducts).toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Selected Merchant Dashboard */}
      {selectedMerchant && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              {selectedMerchant.name} Dashboard
            </Typography>
            
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<UploadIcon />}
                onClick={handleOpenUploadDialog}
                sx={{ mr: 1 }}
              >
                Upload Feed
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={handleRefreshFeed}
                disabled={loading}
              >
                Refresh Data
              </Button>
            </Box>
          </Box>
          
          {/* Product Status Summary */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Product Status Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card sx={{ backgroundColor: '#e8f5e9', height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Approved Products
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                      {selectedMerchant.approvedProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {calculateApprovalRate(selectedMerchant.approvedProducts, selectedMerchant.totalProducts).toFixed(1)}% of total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ backgroundColor: '#ffebee', height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Disapproved Products
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#c62828' }}>
                      {selectedMerchant.disapprovedProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {calculateApprovalRate(selectedMerchant.disapprovedProducts, selectedMerchant.totalProducts).toFixed(1)}% of total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ backgroundColor: '#fff8e1', height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Products
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#f57c00' }}>
                      {selectedMerchant.pendingProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {calculateApprovalRate(selectedMerchant.pendingProducts, selectedMerchant.totalProducts).toFixed(1)}% of total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ backgroundColor: '#f3f4f6', height: '100%' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography variant="h4">
                      {selectedMerchant.totalProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Across all feeds
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Tabs for Feed Info, Products, and Issues */}
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Feed Information" />
              <Tab label="Products" />
              <Tab label="Product Issues" />
            </Tabs>
          </Box>
          
          {/* Feed Information Tab */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Feeds
              </Typography>
              
              {loading ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Feed Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Last Upload</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {feeds.map((feed) => (
                        <TableRow key={feed.id}>
                          <TableCell>{feed.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={feed.feedType} 
                              size="small"
                              color={
                                feed.feedType === 'PRIMARY' ? 'primary' :
                                feed.feedType === 'SUPPLEMENTAL' ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(feed.lastUploadDate).toLocaleDateString()} {new Date(feed.lastUploadDate).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {feed.itemsSuccessful} / {feed.itemsTotal} successful
                            <LinearProgress 
                              variant="determinate" 
                              value={(feed.itemsSuccessful / feed.itemsTotal) * 100}
                              sx={{ 
                                mt: 1,
                                backgroundColor: '#f5f5f5',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 
                                    feed.itemsWithErrors > 0 ? '#f44336' :
                                    feed.itemsWithWarnings > 0 ? '#ff9800' : '#4caf50'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={feed.processingStatus} 
                              size="small"
                              color={
                                feed.processingStatus === 'SUCCESS' ? 'success' :
                                feed.processingStatus === 'PROCESSING' ? 'info' :
                                feed.processingStatus === 'FAILURE' ? 'error' : 'default'
                              }
                              icon={
                                feed.processingStatus === 'SUCCESS' ? <CheckIcon /> :
                                feed.processingStatus === 'PROCESSING' ? <ScheduleIcon /> :
                                feed.processingStatus === 'FAILURE' ? <ErrorIcon /> : null
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="small" color="primary">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
          
          {/* Products Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Products
                </Typography>
                
                <TextField
                  placeholder="Search products..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          ✕
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
              
              {loading ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : filteredProducts.length === 0 ? (
                <Alert severity="info">No products match your search criteria.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Availability</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                component="img" 
                                src={product.imageLink} 
                                alt={product.title}
                                sx={{ 
                                  width: 50, 
                                  height: 50, 
                                  objectFit: 'contain',
                                  mr: 2,
                                  border: '1px solid #eee'
                                }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50';
                                }}
                              />
                              <Box>
                                <Typography variant="body2" component="div">
                                  {product.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {product.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            {product.price.value.toFixed(2)} {product.price.currency}
                          </TableCell>
                          <TableCell>{product.availability}</TableCell>
                          <TableCell>
                            <Chip 
                              label={product.status} 
                              size="small"
                              color={
                                product.status === 'approved' ? 'success' :
                                product.status === 'pending' ? 'warning' :
                                'error'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="small" color="primary">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
          
          {/* Product Issues Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Issues
              </Typography>
              
              {loading ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : productIssues.length === 0 ? (
                <Alert severity="success" sx={{ my: 2 }}>No product issues found. All products are compliant.</Alert>
              ) : (
                <Grid container spacing={3}>
                  {productIssues.map((issue) => (
                    <Grid item xs={12} key={issue.code}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          borderLeft: 4,
                          borderColor: issue.severity === 'error' ? '#f44336' : '#ff9800'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            {issue.severity === 'error' ? (
                              <ErrorIcon color="error" sx={{ mr: 2, mt: 0.5 }} />
                            ) : (
                              <WarningIcon color="warning" sx={{ mr: 2, mt: 0.5 }} />
                            )}
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                {issue.description}
                              </Typography>
                              
                              <Typography variant="body2" gutterBottom>
                                Affects <strong>{issue.count}</strong> products
                              </Typography>
                              
                              <Divider sx={{ my: 1 }} />
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Resolution:</strong> {issue.resolution}
                              </Typography>
                              
                              <Typography variant="caption" color="text.secondary">
                                <strong>Examples:</strong> {issue.affectedSample.join(', ')}
                              </Typography>
                            </Box>
                            
                            <Chip 
                              label={`${issue.count} affected`}
                              color={issue.severity === 'error' ? 'error' : 'warning'}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}
        </>
      )}
      
      {/* Upload Feed Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Product Feed</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              Select feed type and file to upload
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Feed Type"
                  fullWidth
                  defaultValue="PRIMARY"
                >
                  <MenuItem value="PRIMARY">Primary Feed</MenuItem>
                  <MenuItem value="SUPPLEMENTAL">Supplemental Feed</MenuItem>
                  <MenuItem value="PRICE">Price Feed</MenuItem>
                  <MenuItem value="INVENTORY">Inventory Feed</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Select File
                  <input
                    type="file"
                    hidden
                  />
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  Supported file formats: CSV, TSV, XML. Maximum file size: 100MB.
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleFeedUpload}
            variant="contained"
            disabled={uploadLoading}
            startIcon={uploadLoading ? <CircularProgress size={20} /> : null}
          >
            {uploadLoading ? 'Uploading...' : 'Upload Feed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantFeedDashboard; 