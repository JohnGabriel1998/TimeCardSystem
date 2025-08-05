import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccessTime,
  CalendarMonth,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Compare,
  Schedule,
  Assignment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuthStore } from '../store/authStore';

interface DashboardData {
  totalHours: number;
  totalEarnings: number;
  scheduledEvents: number;
  activeTimeCard: boolean;
  weeklyData: any[];
  monthlyEarnings: any[];
  previousMonthEarnings: number;
  currentMonthEarnings: number;
  monthlySalaryData: any[];
  salaryComparison: {
    difference: number;
    percentage: number;
    isIncrease: boolean;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    totalHours: 0,
    totalEarnings: 0,
    scheduledEvents: 0,
    activeTimeCard: false,
    weeklyData: [],
    monthlyEarnings: [],
    previousMonthEarnings: 0,
    currentMonthEarnings: 0,
    monthlySalaryData: [],
    salaryComparison: {
      difference: 0,
      percentage: 0,
      isIncrease: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchDashboardData();
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      const currentDate = new Date();
      const currentMonthStart = startOfMonth(currentDate);
      const currentMonthEnd = endOfMonth(currentDate);
      
      // Get data for last 6 months for the salary chart
      const monthsToFetch = 6;
      const monthlyPromises = [];
      
      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(currentDate, i);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);
        
        monthlyPromises.push(
          api.get('/api/timecards', {
            params: { 
              startDate: format(startDate, 'yyyy-MM-dd'), 
              endDate: format(endDate, 'yyyy-MM-dd') 
            }
          }).then(res => ({
            month: format(monthDate, 'MMM yyyy'),
            monthKey: format(monthDate, 'yyyy-MM'),
            data: res.data,
            isCurrentMonth: i === 0,
            isPreviousMonth: i === 1
          }))
        );
      }

      const [currentSchedulesRes, ...monthlyResults] = await Promise.all([
        api.get('/api/schedules', {
          params: { 
            startDate: format(currentMonthStart, 'yyyy-MM-dd'), 
            endDate: format(currentMonthEnd, 'yyyy-MM-dd') 
          }
        }),
        ...monthlyPromises
      ]);

      const schedules = currentSchedulesRes.data;
      const currentMonthData = monthlyResults.find(r => r.isCurrentMonth);
      const previousMonthData = monthlyResults.find(r => r.isPreviousMonth);

      if (!currentMonthData) return;

      const timecards = currentMonthData.data;

      // Calculate current month totals
      const totalHours = timecards.reduce((sum: number, tc: any) => sum + tc.totalHours, 0);
      const totalEarnings = timecards.reduce((sum: number, tc: any) => sum + tc.totalPay, 0);
      const activeTimeCard = timecards.some((tc: any) => tc.status === 'active');

      // Calculate previous month earnings
      const previousMonthEarnings = previousMonthData ? 
        previousMonthData.data.reduce((sum: number, tc: any) => sum + tc.totalPay, 0) : 0;

      // Calculate salary comparison
      const difference = totalEarnings - previousMonthEarnings;
      const percentage = previousMonthEarnings > 0 ? 
        Math.abs((difference / previousMonthEarnings) * 100) : 0;
      const isIncrease = difference >= 0;

      // Process data
      const weeklyData = processWeeklyData(timecards);
      const monthlyEarnings = processMonthlyEarnings(timecards);
      
      // Process monthly salary data (last 6 months)
      const monthlySalaryData = monthlyResults.reverse().map(monthResult => ({
        month: monthResult.month,
        salary: monthResult.data.reduce((sum: number, tc: any) => sum + tc.totalPay, 0),
        hours: monthResult.data.reduce((sum: number, tc: any) => sum + tc.totalHours, 0)
      }));

      setData({
        totalHours: Math.round(totalHours * 100) / 100,
        totalEarnings,
        scheduledEvents: schedules.length,
        activeTimeCard,
        weeklyData,
        monthlyEarnings,
        previousMonthEarnings,
        currentMonthEarnings: totalEarnings,
        monthlySalaryData,
        salaryComparison: {
          difference,
          percentage: Math.round(percentage * 100) / 100,
          isIncrease
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (timecards: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = days.map(day => ({ day, hours: 0 }));

    timecards.forEach(tc => {
      const dayIndex = new Date(tc.date).getDay();
      weekData[dayIndex].hours += tc.totalHours;
    });

    return weekData;
  };

  const processMonthlyEarnings = (timecards: any[]) => {
    const groupedByDate = timecards.reduce((acc: any, tc: any) => {
      const date = format(new Date(tc.date), 'MM/dd');
      if (!acc[date]) {
        acc[date] = { date, regular: 0, overtime: 0, night: 0 };
      }
      acc[date].regular += tc.regularPay;
      acc[date].overtime += tc.overtimePay || 0;
      acc[date].night += tc.nightShiftPay;
      return acc;
    }, {});

    return Object.values(groupedByDate);
  };

  const statsCards = [
    {
      title: 'Total Hours',
      value: `${data.totalHours}h`,
      icon: <AccessTime />,
      color: '#1976d2',
    },
    {
      title: 'Current Month Salary',
      value: `¥${data.currentMonthEarnings.toLocaleString()}`,
      icon: <AttachMoney />,
      color: '#4caf50',
    },
    {
      title: 'Previous Month Comparison',
      value: `¥${data.previousMonthEarnings.toLocaleString()}`,
      subtitle: data.salaryComparison.difference !== 0 ? (
        <Box display="flex" alignItems="center" mt={1}>
          {data.salaryComparison.isIncrease ? (
            <TrendingUp sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
          ) : (
            <TrendingDown sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
          )}
          <Typography 
            variant="caption" 
            sx={{ 
              color: data.salaryComparison.isIncrease ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}
          >
            {data.salaryComparison.isIncrease ? '+' : ''}
            ¥{Math.abs(data.salaryComparison.difference).toLocaleString()} 
            ({data.salaryComparison.percentage}%)
          </Typography>
        </Box>
      ) : null,
      icon: <Compare />,
      color: data.salaryComparison.isIncrease ? '#4caf50' : '#f44336',
    },
    {
      title: 'Scheduled Events',
      value: data.scheduledEvents,
      icon: <CalendarMonth />,
      color: '#ff9800',
    },
    {
      title: 'Status',
      value: data.activeTimeCard ? 'Clocked In' : 'Clocked Out',
      icon: <TrendingUp />,
      color: data.activeTimeCard ? '#4caf50' : '#f44336',
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box textAlign="center">
          <LinearProgress sx={{ width: 300, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

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
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
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
                  Welcome back, {user?.username || 'User'}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Here's your timecard overview for today
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 3,
                  color: 'white',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {format(currentTime, 'HH:mm:ss')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {format(currentTime, 'EEEE, MMM dd, yyyy')}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            background: data.activeTimeCard 
              ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
              : 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center">
            <Schedule sx={{ fontSize: 30, mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {data.activeTimeCard ? '🟢 Currently Clocked In' : '🔴 Currently Clocked Out'}
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${card.color}, ${alpha(card.color, 0.6)})`,
                  }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      sx={{
                        backgroundColor: alpha(card.color, 0.1),
                        color: card.color,
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box flex={1}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 0.5 }}
                      >
                        {card.title}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: card.color }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                  </Box>
                  {card.subtitle && (
                    <Box mt={1}>
                      {card.subtitle}
                    </Box>
                  )}
                </CardContent>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: 450,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: alpha('#1976d2', 0.1),
                    color: '#1976d2',
                    mr: 2,
                  }}
                >
                  <Assignment />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Weekly Hours Overview
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="hours"
                    fill="url(#weeklyGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1976d2" />
                      <stop offset="100%" stopColor="#64b5f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: 450,
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
                  <AttachMoney />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Monthly Salary History
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data.monthlySalaryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'salary' ? `¥${value.toLocaleString()}` : `${value}h`,
                      name === 'salary' ? 'Salary' : 'Hours'
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="salary"
                    fill="url(#salaryGradient)"
                    name="Monthly Salary (¥)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4caf50" />
                      <stop offset="100%" stopColor="#81c784" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: 450,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    backgroundColor: alpha('#9c27b0', 0.1),
                    color: '#9c27b0',
                    mr: 2,
                  }}
                >
                  <TrendingUp />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Daily Earnings Breakdown - Current Month
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={data.monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any, name: string) => [
                      `¥${value.toLocaleString()}`,
                      name === 'regular' ? 'Regular (¥1000/h)' : 'Night Shift (¥1250/h)'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="regular"
                    stroke="#1976d2"
                    name="Regular Pay"
                    strokeWidth={3}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="night"
                    stroke="#9c27b0"
                    name="Night Shift Pay"
                    strokeWidth={3}
                    dot={{ fill: '#9c27b0', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}