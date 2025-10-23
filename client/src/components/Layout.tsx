import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  AccessTime,
  CalendarMonth,
  Assessment,
  Logout,
  Person,
  Settings,
  Save,
  Email,
  Phone,
  LocationOn,
  Work,
  Notifications,
  Security,
  Palette,
  Language,
  Close,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 280;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <Dashboard />, 
    path: '/dashboard', 
  },
  { 
    text: 'Time Card', 
    icon: <AccessTime />, 
    path: '/timecard', 
  },
  { 
    text: 'Schedule', 
    icon: <CalendarMonth />, 
    path: '/schedule', 
  },
  { 
    text: 'Reports', 
    icon: <Assessment />, 
    path: '/reports', 
  },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    location: '',
    jobTitle: '',
    department: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailNotifications: false,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    autoLogout: 30,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setProfileDialogOpen(true);
    setAnchorEl(null);
  };

  const handlePreferencesClick = () => {
    setPreferencesDialogOpen(true);
    setAnchorEl(null);
  };

  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    // Here you would typically make an API call to save the profile
    console.log('Saving profile:', profileForm);
    // For now, just close the dialog
    setProfileDialogOpen(false);
  };

  const handleSavePreferences = () => {
    // Here you would typically make an API call to save preferences
    console.log('Saving preferences:', preferences);
    // For now, just close the dialog
    setPreferencesDialogOpen(false);
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    return currentItem?.text || 'Personal TimeCard';
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: '#ffffff',
        position: 'relative',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: '1px solid #f5f5f5',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              }}
            >
              <AccessTime sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                }}
              >
                TimeCard
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#888',
                  fontSize: '0.75rem',
                }}
              >
                Workforce Management
              </Typography>
            </Box>
          </Box>
          
          {/* User Profile */}
          <Box
            sx={{
              p: 2.5,
              background: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #f0f0f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: '#f5f6fa',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mr: 2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}>
                  {user?.username || 'User'}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#e8f5e8',
                    borderRadius: '8px',
                    px: 1,
                    py: 0.3,
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#4caf50',
                      mr: 0.5,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#4caf50', fontSize: '0.7rem', fontWeight: 600 }}>
                    Online
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ px: 2, py: 3 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#888', 
            fontWeight: 600, 
            fontSize: '0.75rem', 
            mb: 2, 
            display: 'block',
            px: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Navigation
        </Typography>
        <List sx={{ p: 0 }}>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
            >
              <ListItemButton 
                component={motion.div}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                sx={{ 
                  borderRadius: '12px', 
                  mb: 1,
                  py: 1.5,
                  px: 2,
                  backgroundColor: location.pathname === item.path ? '#f0f4ff' : 'transparent',
                  border: location.pathname === item.path ? '1px solid #e3edff' : '1px solid transparent',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: '#f8faff',
                    border: '1px solid #f0f4ff',
                  },
                  '&:before': location.pathname === item.path ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '0 4px 4px 0',
                  } : {},
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: location.pathname === item.path ? '#667eea' : '#666',
                    minWidth: 40,
                    '& svg': {
                      fontSize: 20,
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    color: location.pathname === item.path ? '#667eea' : '#333',
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.9rem',
                    }
                  }}
                />
              </ListItemButton>
            </motion.div>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          borderTop: '1px solid #f5f5f5',
          background: '#fafafa',
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#aaa',
            textAlign: 'center',
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 500,
          }}
        >
          © 2025 Personal TimeCard v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Modern AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              background: 'rgba(44, 62, 80, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(44, 62, 80, 0.2)',
                transform: 'rotate(180deg)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {getCurrentPageTitle()}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block',
                mt: -0.5,
              }}
            >
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={handleMenuClick}
              sx={{
                background: 'rgba(44, 62, 80, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(44, 62, 80, 0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 35, 
                  height: 35,
                  background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>

          {/* Enhanced User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                minWidth: 220,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: 45,
                    height: 45,
                    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                    mr: 2,
                    fontWeight: 600,
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user?.username || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Personal Account
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <MenuItem
              onClick={handleProfileClick}
              sx={{
                py: 1.5,
                '&:hover': {
                  background: 'rgba(44, 62, 80, 0.1)',
                },
              }}
            >
              <ListItemIcon>
                <Person sx={{ color: '#2c3e50' }} />
              </ListItemIcon>
              <ListItemText primary="Profile Settings" />
            </MenuItem>
            
            <MenuItem
              onClick={handlePreferencesClick}
              sx={{
                py: 1.5,
                '&:hover': {
                  background: 'rgba(44, 62, 80, 0.1)',
                },
              }}
            >
              <ListItemIcon>
                <Settings sx={{ color: '#2c3e50' }} />
              </ListItemIcon>
              <ListItemText primary="Preferences" />
            </MenuItem>
            
            <Divider sx={{ my: 1 }} />
            
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: '#f44336',
                '&:hover': {
                  background: alpha('#f44336', 0.1),
                },
              }}
            >
              <ListItemIcon>
                <Logout sx={{ color: '#f44336' }} />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {/* Modern Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          position: 'relative',
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            pt: { xs: 8, sm: 10 },
            pb: 3,
            px: 3,
            minHeight: '100vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>

      {/* Profile Settings Dialog */}
      <Dialog 
        open={profileDialogOpen} 
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box display="flex" alignItems="center">
            <Person sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Profile Settings
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setProfileDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Profile Picture Section */}
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: '#f8f9fa',
                  textAlign: 'center' 
                }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    margin: '0 auto 16px',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {user?.username || 'User'}
                </Typography>
                <Chip 
                  label="Personal Account" 
                  size="small" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white' 
                  }} 
                />
              </Paper>
            </Grid>

            {/* Personal Information */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={profileForm.username}
                onChange={(e) => handleProfileFormChange('username', e.target.value)}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(e) => handleProfileFormChange('email', e.target.value)}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => handleProfileFormChange('phone', e.target.value)}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={profileForm.location}
                onChange={(e) => handleProfileFormChange('location', e.target.value)}
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={profileForm.jobTitle}
                onChange={(e) => handleProfileFormChange('jobTitle', e.target.value)}
                InputProps={{
                  startAdornment: <Work sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={profileForm.department}
                onChange={(e) => handleProfileFormChange('department', e.target.value)}
                InputProps={{
                  startAdornment: <Work sx={{ mr: 1, color: '#667eea' }} />
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setProfileDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile}
            variant="contained"
            startIcon={<Save />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog 
        open={preferencesDialogOpen} 
        onClose={() => setPreferencesDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box display="flex" alignItems="center">
            <Settings sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Preferences
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setPreferencesDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Notification Settings */}
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Notifications sx={{ mr: 2, color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications}
                      onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    />
                  }
                  label="Enable push notifications"
                  sx={{ mb: 1, display: 'block' }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Enable email notifications"
                  sx={{ display: 'block' }}
                />
              </Paper>
            </Grid>

            {/* Appearance Settings */}
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Palette sx={{ mr: 2, color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Appearance
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.darkMode}
                      onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                      disabled
                    />
                  }
                  label="Dark mode (Coming Soon)"
                  sx={{ mb: 2, display: 'block' }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={preferences.dateFormat}
                    label="Date Format"
                    onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  >
                    <SelectMenuItem value="MM/dd/yyyy">MM/DD/YYYY</SelectMenuItem>
                    <SelectMenuItem value="dd/MM/yyyy">DD/MM/YYYY</SelectMenuItem>
                    <SelectMenuItem value="yyyy-MM-dd">YYYY-MM-DD</SelectMenuItem>
                  </Select>
                </FormControl>
              </Paper>
            </Grid>

            {/* Language & Region */}
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Language sx={{ mr: 2, color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Language & Region
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={preferences.language}
                        label="Language"
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      >
                        <SelectMenuItem value="en">English</SelectMenuItem>
                        <SelectMenuItem value="es">Spanish</SelectMenuItem>
                        <SelectMenuItem value="fr">French</SelectMenuItem>
                        <SelectMenuItem value="ja">Japanese</SelectMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={preferences.timezone}
                        label="Timezone"
                        onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      >
                        <SelectMenuItem value="UTC">UTC</SelectMenuItem>
                        <SelectMenuItem value="PST">PST</SelectMenuItem>
                        <SelectMenuItem value="EST">EST</SelectMenuItem>
                        <SelectMenuItem value="JST">JST</SelectMenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Security sx={{ mr: 2, color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Security
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>Auto Logout (minutes)</InputLabel>
                  <Select
                    value={preferences.autoLogout}
                    label="Auto Logout (minutes)"
                    onChange={(e) => handlePreferenceChange('autoLogout', e.target.value)}
                  >
                    <SelectMenuItem value={15}>15 minutes</SelectMenuItem>
                    <SelectMenuItem value={30}>30 minutes</SelectMenuItem>
                    <SelectMenuItem value={60}>1 hour</SelectMenuItem>
                    <SelectMenuItem value={120}>2 hours</SelectMenuItem>
                  </Select>
                </FormControl>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setPreferencesDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePreferences}
            variant="contained"
            startIcon={<Save />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}