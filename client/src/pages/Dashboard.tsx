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
  Divider,
  Stack,
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
  WorkOutline,
  Person,
  Analytics,
  Timeline,
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
  Area,
  AreaChart,
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
      title: 'Total Hours This Month',
      value: data.totalHours,
      displayValue: `${data.totalHours}h`,
      icon: <AccessTime />,
      color: '#667eea',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: null,
    },
    {
      title: 'Current Month Earnings',
      value: data.currentMonthEarnings,
      displayValue: `¥${data.currentMonthEarnings.toLocaleString()}`,
      icon: <AttachMoney />,
      color: '#4caf50',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      trend: data.salaryComparison.difference !== 0 ? {
        value: data.salaryComparison.difference,
        percentage: data.salaryComparison.percentage,
        isPositive: data.salaryComparison.isIncrease
      } : null,
    },
    {
      title: 'Work Status',
      value: data.activeTimeCard ? 'Active' : 'Inactive',
      displayValue: data.activeTimeCard ? 'Clocked In' : 'Clocked Out',
      icon: <WorkOutline />,
      color: data.activeTimeCard ? '#4caf50' : '#ff5722',
      bgGradient: data.activeTimeCard 
        ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        : 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      trend: null,
    },
    {
      title: 'Scheduled Events',
      value: data.scheduledEvents,
      displayValue: `${data.scheduledEvents} Events`,
      icon: <CalendarMonth />,
      color: '#ff9800',
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      trend: null,
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              minWidth: 300,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mb: 3,
                mx: 'auto',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Analytics sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Loading Your Dashboard
            </Typography>
            <LinearProgress 
              sx={{ 
                width: '100%', 
                mb: 2, 
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                },
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              Gathering your timecard data...
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f5f5',
        p: 3,
      }}
    >
      {/* Modern Header Section */}
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
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          <Box position="relative" zIndex={1}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      width: 70,
                      height: 70,
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      mr: 3,
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Person sx={{ fontSize: '2rem' }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      Welcome back, {user?.username || 'User'}! 👋
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        opacity: 0.9,
                        fontWeight: 400,
                      }}
                    >
                      {format(currentTime, 'EEEE, MMMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="right">
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {format(currentTime, 'HH:mm:ss')}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Current Time
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Box display="flex" justifyContent="center" mb={4}>
          <Chip
            icon={<Schedule />}
            label={data.activeTimeCard ? '🟢 Currently Clocked In' : '🔴 Currently Clocked Out'}
            sx={{
              py: 2,
              px: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: data.activeTimeCard 
                ? 'linear-gradient(135deg, #a8edea 0%, #4facfe 100%)'
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 25,
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '1.2rem',
              },
            }}
          />
        </Box>
      </motion.div>

      {/* Modern Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Gradient Background */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: card.bgGradient,
                    opacity: 0.1,
                  }}
                />
                
                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        background: card.bgGradient,
                        color: 'white',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    {card.trend && (
                      <Box textAlign="right">
                        <Box display="flex" alignItems="center" mb={0.5}>
                          {card.trend.isPositive ? (
                            <TrendingUp sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: card.trend.isPositive ? '#4caf50' : '#f44336',
                              fontWeight: 700,
                            }}
                          >
                            {card.trend.percentage}%
                          </Typography>
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: card.trend.isPositive ? '#4caf50' : '#f44336',
                            fontWeight: 600,
                          }}
                        >
                          {card.trend.isPositive ? '+' : ''}¥{Math.abs(card.trend.value).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    {card.title}
                  </Typography>
                  
                  <Typography
                    variant="h4"
                    sx={{ 
                      fontWeight: 700,
                      color: '#2d3748',
                      mb: 1,
                    }}
                  >
                    {card.displayValue}
                  </Typography>
                  
                  {/* Progress indicator for hours */}
                  {card.title.includes('Hours') && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.min(((card.value as number) / 160) * 100, 100).toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(((card.value as number) / 160) * 100, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          '& .MuiLinearProgress-bar': {
                            background: card.bgGradient,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Enhanced Charts Section */}
      <Grid container spacing={4}>
        {/* Weekly Hours Chart */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: 420,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <Timeline />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    Weekly Hours Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your work hours distribution this week
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <ResponsiveContainer width="100%" height="75%">
                <BarChart data={data.weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="weeklyBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(20px)',
                    }}
                    formatter={(value: any) => [`${value}h`, 'Hours']}
                  />
                  <Bar
                    dataKey="hours"
                    fill="url(#weeklyBarGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Monthly Salary Chart */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: 420,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    Salary Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 6 months earnings overview
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <ResponsiveContainer width="100%" height="75%">
                <AreaChart data={data.monthlySalaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4facfe" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#00f2fe" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(20px)',
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'salary' ? `¥${value.toLocaleString()}` : `${value}h`,
                      name === 'salary' ? 'Earnings' : 'Hours'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="salary"
                    stroke="#4facfe"
                    fill="url(#salaryAreaGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#4facfe', strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Daily Earnings Breakdown */}
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
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <Analytics />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    Daily Earnings Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regular vs Night Shift earnings this month
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyEarnings} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="regularGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                      <linearGradient id="nightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff6b6b" />
                        <stop offset="100%" stopColor="#ee5a52" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: 12,
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(20px)',
                      }}
                      formatter={(value: any, name: string) => [
                        `¥${value.toLocaleString()}`,
                        name === 'regular' ? 'Regular Pay (¥1000/h)' : 'Night Shift (¥1250/h)'
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="regular"
                      stroke="url(#regularGradient)"
                      name="Regular Pay"
                      strokeWidth={4}
                      dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="night"
                      stroke="url(#nightGradient)"
                      name="Night Shift Pay"
                      strokeWidth={4}
                      dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#ff6b6b', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}