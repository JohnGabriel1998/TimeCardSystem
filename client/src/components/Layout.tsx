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
  Paper,
  alpha,
  Chip,
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    return currentItem?.text || 'Personal TimeCard';
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Header Section */}
      <Box
        sx={{
          p: 3,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                mr: 2,
                border: '2px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <AccessTime sx={{ color: 'white', fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                Personal TimeCard
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                }}
              >
                Workforce Management
              </Typography>
            </Box>
          </Box>
          
          {/* User Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255, 255, 255, 0.2)',
                  mr: 2,
                  fontWeight: 600,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.username || 'User'}
                </Typography>
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    color: '#4caf50',
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 2, position: 'relative', zIndex: 1 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
          >
            <ListItemButton 
              component={motion.div}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                backdropFilter: location.pathname === item.path ? 'blur(10px)' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
              />
            </ListItemButton>
          </motion.div>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            display: 'block',
          }}
        >
          © 2025 Personal TimeCard
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
    </Box>
  );
}