import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  alpha,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Download, 
  Print, 
  Assessment, 
  TrendingUp, 
  Schedule, 
  AttachMoney,
  AccessTime,
  CalendarToday,
  Visibility,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../lib/axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ReportData {
  totalHours: number;
  totalRegularHours: number;
  totalNightHours: number;
  totalEarnings: number;
  totalRegularPay: number;
  totalNightPay: number;
  averageHoursPerDay: number;
  daysWorked: number;
  timeCards: any[];
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalHours: 0,
    totalRegularHours: 0,
    totalNightHours: 0,
    totalEarnings: 0,
    totalRegularPay: 0,
    totalNightPay: 0,
    averageHoursPerDay: 0,
    daysWorked: 0,
    timeCards: [],
  });
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [reportType, setReportType] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    try {
      const response = await api.get('/api/timecards', {
        params: { startDate, endDate },
      });
      const timeCards = response.data;

      const data = calculateReportData(timeCards);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (timeCards: any[]) => {
    const completedCards = timeCards.filter(tc => tc.status === 'completed');
    
    const totalHours = completedCards.reduce((sum, tc) => sum + tc.totalHours, 0);
    const totalRegularHours = completedCards.reduce((sum, tc) => sum + tc.regularHours, 0);
    const totalNightHours = completedCards.reduce((sum, tc) => sum + tc.nightShiftHours, 0);
    const totalEarnings = completedCards.reduce((sum, tc) => sum + tc.totalPay, 0);
    const totalRegularPay = completedCards.reduce((sum, tc) => sum + tc.regularPay, 0);
    const totalNightPay = completedCards.reduce((sum, tc) => sum + tc.nightShiftPay, 0);
    const daysWorked = completedCards.length;
    const averageHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

    return {
      totalHours,
      totalRegularHours,
      totalNightHours,
      totalEarnings,
      totalRegularPay,
      totalNightPay,
      averageHoursPerDay,
      daysWorked,
      timeCards: completedCards,
    };
  };

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    const now = new Date();
    
    switch (type) {
      case 'weekly':
        setStartDate(new Date(now.setDate(now.getDate() - 7)));
        setEndDate(new Date());
        break;
      case 'monthly':
        setStartDate(startOfMonth(new Date()));
        setEndDate(endOfMonth(new Date()));
        break;
      case 'yearly':
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(new Date(now.getFullYear(), 11, 31));
        break;
    }
  };

  const pieData = [
    { name: 'Regular Hours', value: reportData.totalRegularHours, color: '#1976d2' },
    { name: 'Night Shift Hours', value: reportData.totalNightHours, color: '#9c27b0' },
  ];

  const dailyData = reportData.timeCards.reduce((acc: any[], tc: any) => {
    const date = format(new Date(tc.date), 'MM/dd');
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.hours += tc.totalHours;
      existing.earnings += tc.totalPay;
    } else {
      acc.push({
        date,
        hours: tc.totalHours,
        earnings: tc.totalPay,
      });
    }
    
    return acc;
  }, []);

  const handleExport = () => {
    // Implementation for CSV export
    const csv = [
      ['Date', 'Time In', 'Time Out', 'Total Hours', 'Regular Pay', 'Night Pay', 'Total Pay'],
      ...reportData.timeCards.map(tc => [
        format(new Date(tc.date), 'yyyy-MM-dd'),
        format(new Date(tc.timeIn), 'HH:mm'),
        tc.timeOut ? format(new Date(tc.timeOut), 'HH:mm') : '',
        tc.totalHours.toFixed(2),
        tc.regularPay,
        tc.nightShiftPay,
        tc.totalPay,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timecard-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f5f5',
        p: 3,
      }}
    >
      {/* Modern Floating Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          <Box position="relative" zIndex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    mr: 3,
                  }}
                >
                  <Assessment sx={{ fontSize: 36 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      mb: 0.5,
                    }}
                  >
                    📊 Analytics & Reports
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Comprehensive insights into your work performance and earnings
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExport}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Print Report
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Enhanced Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              fontWeight: 700, 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <BarChartIcon sx={{ color: '#43e97b' }} />
            Report Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600 }}>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover': {
                        '& > fieldset': {
                          borderColor: '#43e97b',
                        },
                      },
                      '&.Mui-focused': {
                        '& > fieldset': {
                          borderColor: '#43e97b',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="weekly">📅 Weekly Report</MenuItem>
                  <MenuItem value="monthly">📊 Monthly Report</MenuItem>
                  <MenuItem value="yearly">🗓️ Yearly Report</MenuItem>
                  <MenuItem value="custom">⚙️ Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                sx={{ 
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: '#43e97b',
                      },
                    },
                    '&.Mui-focused': {
                      '& > fieldset': {
                        borderColor: '#43e97b',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                sx={{ 
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: '#43e97b',
                      },
                    },
                    '&.Mui-focused': {
                      '& > fieldset': {
                        borderColor: '#43e97b',
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Enhanced Summary Cards */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box position="relative" zIndex={1} textAlign="center">
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <AccessTime sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {reportData.totalHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Total Hours Worked
                  </Typography>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box position="relative" zIndex={1} textAlign="center">
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    ¥{reportData.totalEarnings.toLocaleString()}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Total Earnings
                  </Typography>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box position="relative" zIndex={1} textAlign="center">
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {reportData.daysWorked}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Days Worked
                  </Typography>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box position="relative" zIndex={1} textAlign="center">
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {reportData.averageHoursPerDay.toFixed(1)}h
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Avg Hours/Day
                  </Typography>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Enhanced Charts Section */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card 
              elevation={0}
              sx={{ 
                p: 4, 
                height: 420,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    color: '#43e97b',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <BarChartIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    📊 Hours Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regular vs Night Shift Hours
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}h`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Card 
              elevation={0}
              sx={{ 
                p: 4, 
                height: 420,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#4caf50',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    📈 Daily Earnings Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track your daily earning patterns
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#43e97b', 0.2)} />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#4caf50" 
                    strokeWidth={4}
                    dot={{ fill: '#4caf50', strokeWidth: 3, r: 6 }}
                    activeDot={{ r: 8, stroke: '#4caf50', strokeWidth: 3, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Enhanced Detailed Table */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              >
                <Box position="relative" zIndex={1} display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mr: 3,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <Visibility sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                      📋 Detailed Time Cards Report
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mt: 0.5 }}>
                      Complete breakdown of all your work sessions
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ p: 4 }}>
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          📅 Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          🕐 Time In
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          🕐 Time Out
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          ⏰ Regular Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          🌙 Night Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          📊 Total Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          💰 Regular Pay
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          🌙 Night Pay
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: 'rgba(67, 233, 123, 0.1)', fontSize: '1rem', py: 2 }}>
                          💵 Total Pay
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.timeCards.map((tc, index) => (
                        <TableRow 
                          key={tc._id}
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: 'rgba(67, 233, 123, 0.03)',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(67, 233, 123, 0.08)',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>
                            <Box display="flex" alignItems="center">
                              <CalendarToday sx={{ fontSize: 18, mr: 2, color: '#43e97b' }} />
                              <Typography sx={{ fontWeight: 600 }}>
                                {format(new Date(tc.date), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip 
                              label={format(new Date(tc.timeIn), 'HH:mm')}
                              size="medium"
                              sx={{ 
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                color: '#4caf50',
                                fontWeight: 700,
                                borderRadius: 3,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            {tc.timeOut ? (
                              <Chip 
                                label={format(new Date(tc.timeOut), 'HH:mm')}
                                size="medium"
                                sx={{ 
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                  color: '#f44336',
                                  fontWeight: 700,
                                  borderRadius: 3,
                                }}
                              />
                            ) : (
                              <Chip 
                                label="In Progress"
                                size="medium"
                                sx={{ 
                                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                  color: '#ff9800',
                                  fontWeight: 700,
                                  borderRadius: 3,
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, fontSize: '1rem' }}>
                            {tc.regularHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, fontSize: '1rem' }}>
                            {tc.nightShiftHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2', py: 2.5, fontSize: '1.1rem' }}>
                            {tc.totalHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#4caf50', py: 2.5, fontSize: '1rem' }}>
                            ¥{tc.regularPay.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#9c27b0', py: 2.5, fontSize: '1rem' }}>
                            ¥{tc.nightShiftPay.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#43e97b', py: 2.5, fontSize: '1.2rem' }}>
                            ¥{tc.totalPay.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow 
                        sx={{ 
                          backgroundColor: 'linear-gradient(135deg, rgba(67, 233, 123, 0.2) 0%, rgba(56, 249, 215, 0.2) 100%)',
                          '& .MuiTableCell-root': {
                            borderBottom: 'none',
                            py: 3,
                          },
                        }}
                      >
                        <TableCell colSpan={3} sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#43e97b' }}>
                          📊 GRAND TOTAL SUMMARY
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#333' }}>
                          {reportData.totalRegularHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#333' }}>
                          {reportData.totalNightHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1976d2' }}>
                          {reportData.totalHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#4caf50' }}>
                          ¥{reportData.totalRegularPay.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#9c27b0' }}>
                          ¥{reportData.totalNightPay.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#43e97b' }}>
                          ¥{reportData.totalEarnings.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}