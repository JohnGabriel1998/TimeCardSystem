import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  PersonAdd,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.6,
            type: "spring",
            stiffness: 100
          }}
        >
          <Paper 
            elevation={24}
            sx={{ 
              padding: { xs: 3, sm: 5 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {/* Header Section */}
            <Box textAlign="center" mb={4}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 10px 30px rgba(118, 75, 162, 0.3)',
                  }}
                >
                  <Schedule sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography 
                  component="h1" 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  Join TimeCard
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: '1.1rem' }}
                >
                  Create your account to get started
                </Typography>
              </motion.div>
            </Box>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Form Section */}
            <Box component="form" onSubmit={handleSubmit}>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mb: 3
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={formData.username}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'action.active' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: '#764ba2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#764ba2',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#764ba2',
                        },
                      }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'action.active' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: '#764ba2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#764ba2',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#764ba2',
                        },
                      }}
                    />
                  </motion.div>
                </Box>

                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mb: 3
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'action.active' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: '#764ba2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#764ba2',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#764ba2',
                        },
                      }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'action.active' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover fieldset': {
                            borderColor: '#764ba2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#764ba2',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#764ba2',
                        },
                      }}
                    />
                  </motion.div>
                </Box>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    startIcon={<PersonAdd />}
                    sx={{ 
                      mt: 3, 
                      mb: 3,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 25px rgba(118, 75, 162, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6a4190 0%, #5a6fd8 100%)',
                        boxShadow: '0 12px 35px rgba(118, 75, 162, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Create Account
                  </Button>
                </motion.div>
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      style={{ 
                        textDecoration: 'none',
                        color: '#764ba2',
                        fontWeight: 600,
                      }}
                    >
                      Sign in here
                    </Link>
                  </Typography>
                </Box>
              </motion.div>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}