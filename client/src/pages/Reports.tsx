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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      {/* Header Section */}
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
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mr: 3,
                }}
              >
                <Assessment sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                  }}
                >
                  Analytics & Reports
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Track your work performance and earnings insights
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              <Tooltip title="Export to CSV">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                  sx={{
                    borderRadius: 3,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      backgroundColor: alpha('#667eea', 0.1),
                    },
                  }}
                >
                  Export CSV
                </Button>
              </Tooltip>
              <Tooltip title="Print Report">
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Print
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
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
                    borderRadius: 2,
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
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {reportData.totalHours.toFixed(1)}h
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Total Hours Worked
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      width: 50,
                      height: 50,
                    }}
                  >
                    <AccessTime sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      ¥{reportData.totalEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Total Earnings
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      width: 50,
                      height: 50,
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {reportData.daysWorked}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Days Worked
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      width: 50,
                      height: 50,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {reportData.averageHoursPerDay.toFixed(1)}h
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Avg Hours/Day
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      width: 50,
                      height: 50,
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: 400,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: alpha('#667eea', 0.1),
                    color: '#667eea',
                    mr: 2,
                  }}
                >
                  <BarChartIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Hours Distribution
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}h`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: 400,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: alpha('#4caf50', 0.1),
                    color: '#4caf50',
                    mr: 2,
                  }}
                >
                  <TrendingUp />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Daily Earnings Trend
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#4caf50" 
                    strokeWidth={3}
                    dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#4caf50', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Detailed Table */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      mr: 2,
                    }}
                  >
                    <Visibility />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Detailed Time Cards Report
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Time In
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Time Out
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Regular Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Night Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Total Hours
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Regular Pay
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Night Pay
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: alpha('#667eea', 0.1) }}>
                          Total Pay
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.timeCards.map((tc, index) => (
                        <TableRow 
                          key={tc._id}
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: alpha('#667eea', 0.03),
                            },
                            '&:hover': {
                              backgroundColor: alpha('#667eea', 0.08),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <CalendarToday sx={{ fontSize: 16, mr: 1, color: '#667eea' }} />
                              {format(new Date(tc.date), 'MMM dd, yyyy')}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={format(new Date(tc.timeIn), 'HH:mm')}
                              size="small"
                              sx={{ 
                                backgroundColor: alpha('#4caf50', 0.1),
                                color: '#4caf50',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {tc.timeOut ? (
                              <Chip 
                                label={format(new Date(tc.timeOut), 'HH:mm')}
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha('#f44336', 0.1),
                                  color: '#f44336',
                                  fontWeight: 600,
                                }}
                              />
                            ) : (
                              <Chip 
                                label="-"
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha('#666', 0.1),
                                  color: '#666',
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {tc.regularHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {tc.nightShiftHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {tc.totalHours.toFixed(2)}h
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            ¥{tc.regularPay.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                            ¥{tc.nightShiftPay.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#667eea', fontSize: '1.1rem' }}>
                            ¥{tc.totalPay.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: alpha('#667eea', 0.1) }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          📊 TOTAL SUMMARY
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {reportData.totalRegularHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {reportData.totalNightHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1976d2' }}>
                          {reportData.totalHours.toFixed(2)}h
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#4caf50' }}>
                          ¥{reportData.totalRegularPay.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#9c27b0' }}>
                          ¥{reportData.totalNightPay.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#667eea' }}>
                          ¥{reportData.totalEarnings.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}