import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  Divider,
  MenuItem,
  TablePagination,
  FormControl,
  InputLabel,
  Select
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
  Schedule as ScheduleIcon,
  UploadFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '@mui/material/styles';
import Layout from '../components/Layout';

// Register Chart.js components
Chart.register(...registerables);

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`merchant-tabpanel-${index}`}
      aria-labelledby={`merchant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MerchantFeedDashboard = () => {
  const { account } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [merchantAccounts, setMerchantAccounts] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [accountSummary, setAccountSummary] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [products, setProducts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [feedFile, setFeedFile] = useState(null);
  const [feedType, setFeedType] = useState('PRIMARY');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [productFilter, setProductFilter] = useState('all');

  // Fetch merchant accounts
  const { 
    data: merchantAccountsData = [], 
    isLoading: isLoadingMerchants, 
    error: merchantError 
  } = useQuery('merchantAccounts', async () => {
    const response = await api.merchant.getAccounts();
    if (response.data.length > 0 && !selectedMerchant) {
      setSelectedMerchant(response.data[0].id);
    }
    return response.data;
  });

  // Fetch merchant account summary
  const { 
    data: accountSummaryData, 
    isLoading: isLoadingSummary 
  } = useQuery(
    ['merchantSummary', selectedMerchant],
    async () => {
      if (!selectedMerchant) return null;
      const response = await api.merchant.getAccountSummary(selectedMerchant);
      return response.data;
    },
    { enabled: !!selectedMerchant }
  );

  // Fetch merchant feeds
  const { 
    data: feedsData = [], 
    isLoading: isLoadingFeeds 
  } = useQuery(
    ['merchantFeeds', selectedMerchant],
    async () => {
      if (!selectedMerchant) return [];
      const response = await api.merchant.getFeeds(selectedMerchant);
      return response.data;
    },
    { enabled: !!selectedMerchant }
  );

  // Fetch products with filter
  const { 
    data: productsData = { products: [], pagination: { page: 1, limit: 50, total: 0, hasMore: false } }, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery(
    ['merchantProducts', selectedMerchant, page, productFilter],
    async () => {
      if (!selectedMerchant) return { products: [], pagination: { page: 1, limit: 50, total: 0, hasMore: false } };
      const status = productFilter !== 'all' ? productFilter : null;
      const response = await api.merchant.getProducts(selectedMerchant, page, 50, status);
      return response.data;
    },
    { enabled: !!selectedMerchant && activeTab === 1 }
  );

  // Fetch aggregated issues
  const { 
    data: issuesData = [], 
    isLoading: isLoadingIssues 
  } = useQuery(
    ['merchantIssues', selectedMerchant],
    async () => {
      if (!selectedMerchant) return [];
      const response = await api.merchant.getIssues(selectedMerchant);
      return response.data;
    },
    { enabled: !!selectedMerchant && activeTab === 2 }
  );

  // Feed upload mutation
  const uploadFeedMutation = useMutation(
    async () => {
      if (!feedFile || !selectedMerchant) return;
      
      const formData = new FormData();
      formData.append('file', feedFile);
      formData.append('feedType', feedType);
      
      return await api.merchant.uploadFeed(selectedMerchant, formData);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch feeds data
        queryClient.invalidateQueries(['merchantFeeds', selectedMerchant]);
        setUploadDialogOpen(false);
        setFeedFile(null);
      }
    }
  );

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle merchant change
  const handleMerchantChange = (event) => {
    setSelectedMerchant(event.target.value);
    setPage(1);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    setFeedFile(event.target.files[0]);
  };

  // Handle dialog open
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setFeedFile(null);
  };

  // Handle feed upload
  const handleUploadFeed = () => {
    uploadFeedMutation.mutate();
  };

  // Render status chip
  const renderStatusChip = (status) => {
    switch(status.toLowerCase()) {
      case 'approved':
        return <Chip icon={<CheckIcon />} label="Approved" color="success" size="small" />;
      case 'disapproved':
        return <Chip icon={<ErrorIcon />} label="Disapproved" color="error" size="small" />;
      case 'pending':
        return <Chip icon={<WarningIcon />} label="Pending" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // If loading initial merchant accounts
  if (isLoadingMerchants) {
    return (
      <Layout title="Merchant Feed Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // If error loading merchants
  if (merchantError) {
    return (
      <Layout title="Merchant Feed Dashboard">
        <Alert severity="error">
          Error loading Merchant Center accounts. Please check your API configuration and try again.
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Merchant Feed Dashboard">
      <Box mb={4}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              Merchant Feed Dashboard
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} container justifyContent="flex-end">
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel id="merchant-select-label">Merchant Account</InputLabel>
              <Select
                labelId="merchant-select-label"
                id="merchant-select"
                value={selectedMerchant}
                onChange={handleMerchantChange}
                label="Merchant Account"
              >
                {merchantAccountsData.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={handleOpenUploadDialog}
              sx={{ ml: 2 }}
            >
              Upload Feed
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Account Summary Cards */}
      {isLoadingSummary ? (
        <LinearProgress sx={{ mb: 4 }} />
      ) : accountSummaryData ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h4" component="div">
                  {accountSummaryData.totalProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approved Products
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {accountSummaryData.approvedProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Disapproved Products
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {accountSummaryData.disapprovedProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Products
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {accountSummaryData.pendingProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Feeds" />
          <Tab label="Products" />
          <Tab label="Issues" />
        </Tabs>

        {/* Feeds Tab */}
        <TabPanel value={activeTab} index={0}>
          {isLoadingFeeds ? (
            <LinearProgress />
          ) : feedsData.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Feed Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Success</TableCell>
                    <TableCell>Warnings</TableCell>
                    <TableCell>Errors</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedsData.map((feed) => (
                    <TableRow key={feed.id}>
                      <TableCell>{feed.name}</TableCell>
                      <TableCell>{feed.feedType}</TableCell>
                      <TableCell>
                        {feed.status === 'ACTIVE' ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label={feed.status} color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{feed.itemsTotal}</TableCell>
                      <TableCell>{feed.itemsSuccessful}</TableCell>
                      <TableCell>{feed.itemsWithWarnings}</TableCell>
                      <TableCell>{feed.itemsWithErrors}</TableCell>
                      <TableCell>{feed.lastUploadDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No feeds found for this merchant account. Upload a product feed to get started.
            </Alert>
          )}
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <FormControl variant="outlined" size="small">
              <InputLabel id="product-filter-label">Filter Status</InputLabel>
              <Select
                labelId="product-filter-label"
                id="product-filter"
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value);
                  setPage(1);
                }}
                label="Filter Status"
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Products</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="disapproved">Disapproved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetchProducts()}
              disabled={isLoadingProducts}
            >
              Refresh
            </Button>
          </Box>

          {isLoadingProducts ? (
            <LinearProgress />
          ) : productsData.products.length > 0 ? (
            <>
              <TableContainer sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Issues</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productsData.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {product.imageLink && (
                              <Box
                                component="img"
                                src={product.imageLink}
                                alt={product.title}
                                sx={{ width: 40, height: 40, mr: 2, objectFit: 'contain' }}
                              />
                            )}
                            <Typography variant="body2">
                              {product.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{product.brand || 'N/A'}</TableCell>
                        <TableCell>
                          {product.price.currency} {product.price.value}
                        </TableCell>
                        <TableCell>
                          {renderStatusChip(product.status)}
                        </TableCell>
                        <TableCell>
                          {product.issues.length > 0 ? (
                            <Chip 
                              icon={product.issues.some(i => i.severity === 'error') ? <ErrorIcon /> : <WarningIcon />}
                              label={`${product.issues.length} ${product.issues.length === 1 ? 'issue' : 'issues'}`}
                              color={product.issues.some(i => i.severity === 'error') ? 'error' : 'warning'}
                              size="small"
                            />
                          ) : (
                            <Chip icon={<CheckIcon />} label="No issues" color="success" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Showing {(page - 1) * 50 + 1} - {Math.min(page * 50, productsData.pagination.total)} of {productsData.pagination.total} products
                </Typography>
                <Box>
                  <Button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    disabled={!productsData.pagination.hasMore} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              No products found matching the selected criteria.
            </Alert>
          )}
        </TabPanel>

        {/* Issues Tab */}
        <TabPanel value={activeTab} index={2}>
          {isLoadingIssues ? (
            <LinearProgress />
          ) : issuesData.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Issue</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Affected Products</TableCell>
                    <TableCell>Resolution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuesData.map((issue) => (
                    <TableRow key={issue.code}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {issue.code}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {issue.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {issue.severity === 'error' ? (
                          <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />
                        ) : (
                          <Chip icon={<WarningIcon />} label="Warning" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{issue.count}</TableCell>
                      <TableCell>
                        {issue.resolution ? (
                          <Typography variant="body2">
                            {issue.resolution}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No resolution available
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success">
              No issues found! All products are compliant.
            </Alert>
          )}
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Product Feed</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a product feed file to upload to your Merchant Center account. 
            Supported formats: CSV, TSV, TXT, XML.
          </DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel id="feed-type-label">Feed Type</InputLabel>
            <Select
              labelId="feed-type-label"
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              label="Feed Type"
            >
              <MenuItem value="PRIMARY">Primary Feed</MenuItem>
              <MenuItem value="SUPPLEMENTAL">Supplemental Feed</MenuItem>
              <MenuItem value="PRICE">Price Feed</MenuItem>
              <MenuItem value="INVENTORY">Inventory Feed</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              Select File
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".csv,.tsv,.txt,.xml"
              />
            </Button>
            {feedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {feedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUploadFeed}
            disabled={!feedFile || uploadFeedMutation.isLoading}
            variant="contained" 
            color="primary"
          >
            {uploadFeedMutation.isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default MerchantFeedDashboard; 