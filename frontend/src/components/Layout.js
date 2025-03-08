import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  Insights as InsightsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  PersonOutline as ProfileIcon,
  ShoppingBag as MerchantIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Drawer width
const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { account, logout } = useAuth();
  
  // Menu items with icons and paths
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { text: 'Optimization', icon: <InsightsIcon />, path: '/optimization' },
    { text: 'Merchant Feed', icon: <MerchantIcon />, path: '/merchant-feed' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };
  
  // Handle account menu
  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };
  
  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };
  
  // Handle notifications menu
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };
  
  const handleNotificationsMenuClose = () => {
    setNotificationsMenuAnchor(null);
  };
  
  // Handle add menu
  const handleAddMenuOpen = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };
  
  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };
  
  // Handle create new campaign options
  const handleCreateShoppingCampaign = () => {
    navigate('/shopping-campaign/create');
    handleAddMenuClose();
  };
  
  const handleCreatePerformanceMaxCampaign = () => {
    navigate('/pmax-campaign/create');
    handleAddMenuClose();
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleAccountMenuClose();
  };
  
  // Close mobile drawer when navigating
  const handleNavigation = () => {
    if (isSmallScreen) {
      setMobileDrawerOpen(false);
    }
  };
  
  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/campaigns') return 'Campaigns';
    if (path === '/optimization') return 'Optimization';
    if (path === '/merchant-feed') return 'Merchant Feed Dashboard';
    if (path === '/settings') return 'Settings';
    if (path === '/shopping-campaign/create') return 'Create Shopping Campaign';
    if (path === '/pmax-campaign/create') return 'Create Performance Max Campaign';
    
    if (path.startsWith('/campaigns/')) {
      return 'Campaign Details';
    }
    
    return 'Echelon';
  };
  
  // Drawer content
  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          ECHELON
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            onClick={handleNavigation}
            selected={location.pathname === item.path}
            sx={{
              borderLeft: location.pathname === item.path 
                ? `4px solid ${theme.palette.primary.main}` 
                : '4px solid transparent',
              bgcolor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' 
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: location.pathname === item.path ? 'medium' : 'normal',
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      {account && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Account:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {account.name}
          </Typography>
        </Box>
      )}
    </>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {getPageTitle()}
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Create New Button */}
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAddMenuOpen}
            sx={{ mr: 2 }}
          >
            Create New
          </Button>
          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor)}
            onClose={handleAddMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleCreateShoppingCampaign}>Shopping Campaign</MenuItem>
            <MenuItem onClick={handleCreatePerformanceMaxCampaign}>Performance Max Campaign</MenuItem>
          </Menu>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsMenuOpen}
              sx={{ mr: 1 }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationsMenuAnchor}
            open={Boolean(notificationsMenuAnchor)}
            onClose={handleNotificationsMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleNotificationsMenuClose}>
              No new notifications
            </MenuItem>
          </Menu>
          
          {/* Account Menu */}
          <Tooltip title="Account settings">
            <IconButton 
              color="inherit" 
              onClick={handleAccountMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar alt="User" src="/static/images/avatar/1.jpg" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={accountMenuAnchor}
            open={Boolean(accountMenuAnchor)}
            onClose={handleAccountMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleAccountMenuClose}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleAccountMenuClose}>
              <ListItemIcon>
                <AccountIcon fontSize="small" />
              </ListItemIcon>
              My account
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer - Desktop (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)', 
            boxShadow: 'none',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
      
      {/* Navigation Drawer - Mobile (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: '64px' // AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 