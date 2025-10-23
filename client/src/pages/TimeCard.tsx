import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit,
  Delete,
  AccessTime,
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  History,
  Upload,
  Download,
  Schedule,
  Timer,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parse, isValid } from 'date-fns';

interface TimeCardData {
  _id: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  totalHours: number;
  regularHours: number;
  nightShiftHours: number;
  totalPay: number;
  regularPay: number;
  nightShiftPay: number;
  status: 'active' | 'completed';
  notes?: string;
}

interface BulkImportEntry {
  date: string;
  timeIn: string;
  timeOut: string;
}

// Safe date formatter
const safeFormat = (date: any, formatStr: string, defaultValue: string = '-') => {
  try {
    if (!date) return defaultValue;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return defaultValue;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error, date);
    return defaultValue;
  }
};

// Calculate hours breakdown
const calculateHoursBreakdown = (timeIn: Date, timeOut: Date) => {
  let regularHours = 0;
  let nightHours = 0;
  
  const currentTime = new Date(timeIn);
  
  while (currentTime < timeOut) {
    const hour = currentTime.getHours();
    const minutesRemaining = Math.min(60, (timeOut.getTime() - currentTime.getTime()) / 1000 / 60);
    const hoursToAdd = minutesRemaining / 60;
    
    // Night shift is 22:00 (10 PM) to 05:59 (6 AM)
    if (hour >= 22 || hour < 6) {
      nightHours += hoursToAdd;
    } else {
      regularHours += hoursToAdd;
    }
    
    // Move to next hour
    currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
  }
  
  const totalHours = regularHours + nightHours;
  
  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
  };
};

export default function TimeCard() {
  const [timeCards, setTimeCards] = useState<TimeCardData[]>([]);
  const [activeCard, setActiveCard] = useState<TimeCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [addHistoryDialog, setAddHistoryDialog] = useState(false);
  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TimeCardData | null>(null);
  const [bulkImportData, setBulkImportData] = useState<BulkImportEntry[]>([]);
  const [editData, setEditData] = useState({
    timeIn: null as Date | null,
    timeOut: null as Date | null,
    notes: '',
  });
  const [historyData, setHistoryData] = useState({
    date: null as Date | null,
    timeIn: null as Date | null,
    timeOut: null as Date | null,
    notes: '',
  });

  useEffect(() => {
    fetchTimeCards();
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentMonth]);

  const fetchTimeCards = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const response = await api.get('/api/timecards', {
        params: { 
          startDate: format(startDate, 'yyyy-MM-dd'), 
          endDate: format(endDate, 'yyyy-MM-dd') 
        }
      });
      const cards = response.data;
      setTimeCards(cards);
      const active = cards.find((card: TimeCardData) => card.status === 'active');
      setActiveCard(active || null);
    } catch (error) {
      console.error('Error fetching time cards:', error);
      toast.error('Failed to fetch time cards');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      const response = await api.post('/api/timecards/clockin', {
        notes: ''
      });
      setActiveCard(response.data);
      await fetchTimeCards();
      toast.success('Clocked in successfully!');
    } catch (error: any) {
      console.error('Error clocking in:', error);
      toast.error(error.response?.data?.error || 'Failed to clock in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      await api.post('/api/timecards/clockout', {
        notes: ''
      });
      setActiveCard(null);
      await fetchTimeCards();
      toast.success('Clocked out successfully!');
    } catch (error: any) {
      console.error('Error clocking out:', error);
      toast.error(error.response?.data?.error || 'Failed to clock out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddHistory = async () => {
    if (!historyData.date || !historyData.timeIn || !historyData.timeOut) {
      toast.error('Please fill all required fields');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      
      // Combine date with times
      const workDate = new Date(historyData.date);
      const timeInHours = historyData.timeIn.getHours();
      const timeInMinutes = historyData.timeIn.getMinutes();
      const timeOutHours = historyData.timeOut.getHours();
      const timeOutMinutes = historyData.timeOut.getMinutes();
      
      const actualTimeIn = new Date(workDate);
      actualTimeIn.setHours(timeInHours, timeInMinutes, 0, 0);
      
      let actualTimeOut = new Date(workDate);
      actualTimeOut.setHours(timeOutHours, timeOutMinutes, 0, 0);
      
      // If timeOut is before timeIn, assume next day
      if (actualTimeOut <= actualTimeIn) {
        actualTimeOut.setDate(actualTimeOut.getDate() + 1);
      }
      
      await api.post('/api/timecards/history', {
        date: format(workDate, 'yyyy-MM-dd'),
        timeIn: actualTimeIn.toISOString(),
        timeOut: actualTimeOut.toISOString(),
        notes: historyData.notes || '',
      });

      await fetchTimeCards();
      setAddHistoryDialog(false);
      setHistoryData({
        date: null,
        timeIn: null,
        timeOut: null,
        notes: '',
      });
      toast.success('Historical time card added successfully!');
    } catch (error: any) {
      console.error('Error adding history:', error);
      toast.error(error.response?.data?.error || 'Failed to add historical time card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (bulkImportData.length === 0) {
      toast.error('No data to import');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      let successCount = 0;
      let failCount = 0;

      for (const entry of bulkImportData) {
        try {
          const date = parse(entry.date, 'yyyy-MM-dd', new Date());
          const [timeInHours, timeInMinutes] = entry.timeIn.split(':').map(Number);
          const [timeOutHours, timeOutMinutes] = entry.timeOut.split(':').map(Number);
          
          const timeIn = new Date(date);
          timeIn.setHours(timeInHours, timeInMinutes, 0, 0);
          
          let timeOut = new Date(date);
          timeOut.setHours(timeOutHours, timeOutMinutes, 0, 0);
          
          // If timeOut is before timeIn, assume next day
          if (timeOut <= timeIn) {
            timeOut.setDate(timeOut.getDate() + 1);
          }

          await api.post('/api/timecards/history', {
            date: format(date, 'yyyy-MM-dd'),
            timeIn: timeIn.toISOString(),
            timeOut: timeOut.toISOString(),
            notes: '',
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import entry for ${entry.date}:`, error);
          failCount++;
        }
      }

      await fetchTimeCards();
      setBulkImportDialog(false);
      setBulkImportData([]);
      
      if (failCount > 0) {
        toast.error(`Imported ${successCount} entries. ${failCount} failed.`);
      } else {
        toast.success(`Successfully imported ${successCount} time cards!`);
      }
    } catch (error: any) {
      console.error('Error during bulk import:', error);
      toast.error('Bulk import failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const entries: BulkImportEntry[] = [];

        // Skip header line if it exists
        const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim());
          if (parts.length >= 3) {
            entries.push({
              date: parts[0],
              timeIn: parts[1],
              timeOut: parts[2],
            });
          }
        }

        setBulkImportData(entries);
        setBulkImportDialog(true);
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `date,timeIn,timeOut
2025-07-08,17:55,23:00
2025-07-09,17:58,23:00
2025-07-10,17:57,23:00
2025-07-11,17:57,23:00
2025-07-12,11:55,17:00
2025-07-13,12:00,18:00
2025-07-19,11:55,18:00
2025-07-20,12:00,18:00
2025-07-24,17:58,23:00
2025-07-25,17:58,23:00
2025-07-26,11:58,18:00
2025-07-27,10:55,18:00
2025-07-31,17:58,23:13`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timecard-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (card: TimeCardData) => {
    try {
      setSelectedCard(card);
      const timeInDate = new Date(card.timeIn);
      const timeOutDate = card.timeOut ? new Date(card.timeOut) : null;
      
      setEditData({
        timeIn: isValid(timeInDate) ? timeInDate : null,
        timeOut: timeOutDate && isValid(timeOutDate) ? timeOutDate : null,
        notes: card.notes || '',
      });
      setEditDialog(true);
    } catch (error) {
      console.error('Error setting edit data:', error);
      toast.error('Failed to load time card data');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCard || !editData.timeIn) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      await api.put(`/api/timecards/${selectedCard._id}`, {
        timeIn: editData.timeIn.toISOString(),
        timeOut: editData.timeOut ? editData.timeOut.toISOString() : null,
        notes: editData.notes,
      });
      await fetchTimeCards();
      setEditDialog(false);
      toast.success('Time card updated successfully!');
    } catch (error) {
      console.error('Error updating time card:', error);
      toast.error('Failed to update time card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time card?')) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      await api.delete(`/api/timecards/${id}`);
      await fetchTimeCards();
      toast.success('Time card deleted successfully!');
    } catch (error) {
      console.error('Error deleting time card:', error);
      toast.error('Failed to delete time card');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar functions
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTimeCardForDate = (date: Date) => {
    return timeCards.find(card => {
      try {
        const cardDate = new Date(card.date);
        return isValid(cardDate) && isSameDay(cardDate, date);
      } catch {
        return false;
      }
    });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const card = getTimeCardForDate(date);
    if (card) {
      handleEdit(card);
    } else if (!isToday(date) && date < new Date()) {
      // Open add history dialog for past dates
      setHistoryData({
        ...historyData,
        date: date,
      });
      setAddHistoryDialog(true);
    }
  };

  const renderCalendarDay = (date: Date) => {
    const timeCard = getTimeCardForDate(date);
    const isActive = activeCard && isSameDay(new Date(activeCard.date), date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return (
      <Paper
        key={date.toISOString()}
        onClick={() => handleDateClick(date)}
        elevation={0}
        sx={{
          p: 2,
          minHeight: 120,
          cursor: 'pointer',
          borderRadius: 3,
          background: isToday(date) 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : timeCard 
              ? 'rgba(76, 175, 80, 0.1)' 
              : isWeekend 
                ? 'rgba(0, 0, 0, 0.05)' 
                : 'rgba(255, 255, 255, 0.8)',
          border: '1px solid',
          borderColor: isActive 
            ? '#667eea' 
            : timeCard 
              ? alpha('#4caf50', 0.3)
              : alpha('#000', 0.1),
          color: isToday(date) ? 'white' : 'inherit',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            borderColor: '#667eea',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: isToday(date) ? 700 : timeCard ? 600 : 'normal',
            mb: 1,
            opacity: isToday(date) ? 1 : 0.8,
          }}
        >
          {format(date, 'd')}
        </Typography>
        {timeCard && (
          <Box>
            <Chip
              size="small"
              label={timeCard.status}
              color={timeCard.status === 'active' ? 'warning' : 'success'}
              sx={{ 
                mb: 1, 
                width: '100%',
                fontSize: '0.7rem',
                borderRadius: 2,
              }}
            />
            <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 500 }}>
              {safeFormat(timeCard.timeIn, 'HH:mm')}
              {timeCard.timeOut && ` - ${safeFormat(timeCard.timeOut, 'HH:mm')}`}
            </Typography>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
              {(timeCard.totalHours || 0).toFixed(1)}h
            </Typography>
            <Typography 
              variant="caption" 
              display="block" 
              sx={{ 
                color: isToday(date) ? 'rgba(255, 255, 255, 0.9)' : '#4caf50',
                fontWeight: 600,
              }}
            >
              ¥{(timeCard.totalPay || 0).toLocaleString()}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // Calculate monthly totals
  const monthlyTotals = timeCards.reduce((acc, card) => {
    if (card.status === 'completed') {
      acc.totalDays += 1;
      acc.totalHours += card.totalHours || 0;
      acc.regularHours += card.regularHours || 0;
      acc.nightHours += card.nightShiftHours || 0;
      acc.totalPay += card.totalPay || 0;
    }
    return acc;
  }, {
    totalDays: 0,
    totalHours: 0,
    regularHours: 0,
    nightHours: 0,
    totalPay: 0,
  });

  if (loading && timeCards.length === 0) {
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
              <Timer sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Loading TimeCard
            </Typography>
            <CircularProgress 
              sx={{ 
                color: '#667eea',
                mb: 2,
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              Preparing your time tracking...
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
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Schedule sx={{ fontSize: '2rem' }} />
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
                      Time Card Management ⏰
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        opacity: 0.9,
                        fontWeight: 400,
                      }}
                    >
                      Track and manage your working hours
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
                      {safeFormat(currentTime, 'HH:mm:ss')}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {safeFormat(currentTime, 'EEEE, MMM dd, yyyy')}
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Enhanced Clock In/Out Status Card */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
                height: 'fit-content',
              }}
            >
              {/* Status Header */}
              <Box
                sx={{
                  p: 3,
                  background: activeCard
                    ? 'linear-gradient(135deg, #a8edea 0%, #4facfe 100%)'
                    : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  textAlign: 'center',
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
                <Box position="relative" zIndex={1}>
                  <Avatar
                    sx={{
                      width: 70,
                      height: 70,
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      margin: '0 auto 16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Timer sx={{ fontSize: 35 }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {activeCard ? '🟢 Currently Active' : '⭕ Currently Inactive'}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                    {activeCard ? 'You are actively tracking time' : 'Ready to start your work session'}
                  </Typography>
                </Box>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {activeCard ? (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Clock In Time
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {safeFormat(activeCard.timeIn, 'HH:mm:ss')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Work Date
                      </Typography>
                      <Typography variant="body1">
                        {safeFormat(activeCard.date, 'yyyy-MM-dd')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Duration
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {(() => {
                          try {
                            const timeIn = new Date(activeCard.timeIn);
                            if (!isValid(timeIn)) return '0h 0m';
                            const duration = Math.floor((currentTime.getTime() - timeIn.getTime()) / 1000 / 60);
                            const hours = Math.floor(duration / 60);
                            const minutes = duration % 60;
                            return `${hours}h ${minutes}m`;
                          } catch {
                            return '0h 0m';
                          }
                        })()}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<LogoutIcon />}
                      fullWidth
                      size="large"
                      onClick={handleClockOut}
                      disabled={submitting}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)',
                        '&:hover': {
                          boxShadow: '0 12px 35px rgba(244, 67, 54, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : 'Clock Out'}
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Alert
                      severity="info"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        backgroundColor: alpha('#2196F3', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#2196F3', 0.2),
                      }}
                    >
                      You are currently clocked out
                    </Alert>

                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<LoginIcon />}
                      fullWidth
                      size="large"
                      onClick={handleClockIn}
                      disabled={submitting}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : 'Clock In'}
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Button
                  variant="outlined"
                  startIcon={<History />}
                  fullWidth
                  onClick={() => setAddHistoryDialog(true)}
                  disabled={submitting}
                  sx={{
                    mb: 2,
                    py: 1.2,
                    borderRadius: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      backgroundColor: alpha('#667eea', 0.1),
                    },
                  }}
                >
                  Add Previous Work Hours
                </Button>

                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                  Bulk Import Options
                </Typography>

                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  sx={{
                    mb: 1,
                    py: 1,
                    borderRadius: 2,
                    borderColor: '#764ba2',
                    color: '#764ba2',
                    '&:hover': {
                      borderColor: '#6a4190',
                      backgroundColor: alpha('#764ba2', 0.1),
                    },
                  }}
                >
                  Import CSV
                </Button>

                <Button
                  variant="text"
                  startIcon={<Download />}
                  fullWidth
                  onClick={downloadTemplate}
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    color: '#667eea',
                    '&:hover': {
                      backgroundColor: alpha('#667eea', 0.1),
                    },
                  }}
                >
                  Download Template
                </Button>
              </CardContent>
            </Paper>
          </motion.div>
        </Grid>

        {/* Monthly Summary */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
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
                    <CalendarMonth />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {safeFormat(currentMonth, 'MMMM yyyy')} Summary
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: alpha('#1976d2', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#1976d2', 0.2),
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                        {monthlyTotals.totalDays}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Days Worked
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: alpha('#4caf50', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#4caf50', 0.2),
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                        {monthlyTotals.totalHours.toFixed(1)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Total Hours
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: alpha('#ff9800', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#ff9800', 0.2),
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                        {monthlyTotals.regularHours.toFixed(1)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Regular Hours
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: alpha('#9c27b0', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#9c27b0', 0.2),
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(156, 39, 176, 0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#9c27b0', mb: 1 }}>
                        {monthlyTotals.nightHours.toFixed(1)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Night Hours
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} lg={2.4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        ¥{monthlyTotals.totalPay.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                        Total Earnings
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Paper>
          </motion.div>
        </Grid>

        {/* View Toggle */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Time Card Records
                </Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="calendar">
                    <CalendarMonth sx={{ mr: 1 }} />
                    Calendar View
                  </ToggleButton>
                  <ToggleButton value="list">
                    <AccessTime sx={{ mr: 1 }} />
                    List View
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Calendar or List View */}
        <Grid item xs={12}>
          {viewMode === 'calendar' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <IconButton
                    onClick={handlePreviousMonth}
                    sx={{
                      backgroundColor: alpha('#667eea', 0.1),
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.2),
                      },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {safeFormat(currentMonth, 'MMMM yyyy')}
                  </Typography>
                  <IconButton
                    onClick={handleNextMonth}
                    sx={{
                      backgroundColor: alpha('#667eea', 0.1),
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.2),
                      },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Grid item xs key={day} sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          p: 1,
                        }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={1}>
                  {Array.from({ length: monthDays[0].getDay() }).map((_, index) => (
                    <Grid item xs={12/7} key={`empty-${index}`}>
                      <Box minHeight={120} />
                    </Grid>
                  ))}
                  {monthDays.map(date => (
                    <Grid item xs={12/7} key={date.toISOString()}>
                      {renderCalendarDay(date)}
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
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
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Time Card History
                  </Typography>
                </Box>
                
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Time In</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Time Out</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Total Hours</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Regular Hours</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Night Hours</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Regular Pay</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Night Pay</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Total Pay</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timeCards.map((card) => (
                        <TableRow
                          key={card._id}
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: alpha('#667eea', 0.05),
                            },
                            '&:hover': {
                              backgroundColor: alpha('#667eea', 0.1),
                            },
                          }}
                        >
                          <TableCell>{safeFormat(card.date, 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{safeFormat(card.date, 'EEE')}</TableCell>
                          <TableCell>{safeFormat(card.timeIn, 'HH:mm:ss')}</TableCell>
                          <TableCell>
                            {card.timeOut ? safeFormat(card.timeOut, 'HH:mm:ss') : '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{(card.totalHours || 0).toFixed(2)}</TableCell>
                          <TableCell>{(card.regularHours || 0).toFixed(2)}</TableCell>
                          <TableCell>{(card.nightShiftHours || 0).toFixed(2)}</TableCell>
                          <TableCell>¥{(card.regularPay || 0).toLocaleString()}</TableCell>
                          <TableCell>¥{(card.nightShiftPay || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#4caf50' }}>
                            ¥{(card.totalPay || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={card.status}
                              color={card.status === 'active' ? 'warning' : 'success'}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(card)}
                              disabled={submitting}
                              sx={{
                                mr: 0.5,
                                color: '#667eea',
                                '&:hover': {
                                  backgroundColor: alpha('#667eea', 0.1),
                                },
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(card._id)}
                              disabled={submitting}
                              sx={{
                                color: '#f44336',
                                '&:hover': {
                                  backgroundColor: alpha('#f44336', 0.1),
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </motion.div>
          )}
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => !submitting && setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Time Card</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TimePicker
              label="Time In (24-hour format)"
              value={editData.timeIn}
              onChange={(newValue) => setEditData({ ...editData, timeIn: newValue })}
              sx={{ mb: 2, width: '100%' }}
              ampm={false}
              disabled={submitting}
            />
            <TimePicker
              label="Time Out (24-hour format)"
              value={editData.timeOut}
              onChange={(newValue) => setEditData({ ...editData, timeOut: newValue })}
              sx={{ mb: 2, width: '100%' }}
              ampm={false}
              disabled={submitting}
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              disabled={submitting}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add History Dialog */}
      <Dialog open={addHistoryDialog} onClose={() => !submitting && setAddHistoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Previous Work Hours</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Rate Information:</strong><br />
                • Regular hours (06:00 - 21:59): ¥1,000/hour<br />
                • Night shift hours (22:00 - 05:59): ¥1,250/hour
              </Typography>
            </Alert>
            <DatePicker
              label="Work Date"
              value={historyData.date}
              onChange={(newValue) => setHistoryData({ ...historyData, date: newValue })}
              sx={{ mb: 2, width: '100%' }}
              maxDate={new Date()}
              format="yyyy-MM-dd"
              disabled={submitting}
            />
            <TimePicker
              label="Time In (24-hour format)"
              value={historyData.timeIn}
              onChange={(newValue) => setHistoryData({ ...historyData, timeIn: newValue })}
              sx={{ mb: 2, width: '100%' }}
              ampm={false}
              disabled={submitting}
            />
            <TimePicker
              label="Time Out (24-hour format)"
              value={historyData.timeOut}
              onChange={(newValue) => setHistoryData({ ...historyData, timeOut: newValue })}
              sx={{ mb: 2, width: '100%' }}
              ampm={false}
              disabled={submitting}
            />
            {historyData.timeIn && historyData.timeOut && historyData.date && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Work Details:</strong><br />
                  Date: {safeFormat(historyData.date, 'yyyy-MM-dd')}<br />
                  Time In: {safeFormat(historyData.timeIn, 'HH:mm')}<br />
                  Time Out: {safeFormat(historyData.timeOut, 'HH:mm')}<br />
                  {(() => {
                    try {
                      const workDate = new Date(historyData.date);
                      const timeInHours = historyData.timeIn.getHours();
                      const timeInMinutes = historyData.timeIn.getMinutes();
                      const timeOutHours = historyData.timeOut.getHours();
                      const timeOutMinutes = historyData.timeOut.getMinutes();
                      
                      const actualTimeIn = new Date(workDate);
                      actualTimeIn.setHours(timeInHours, timeInMinutes, 0, 0);
                      
                      let actualTimeOut = new Date(workDate);
                      actualTimeOut.setHours(timeOutHours, timeOutMinutes, 0, 0);
                      
                      if (actualTimeOut <= actualTimeIn) {
                        actualTimeOut.setDate(actualTimeOut.getDate() + 1);
                      }
                      
                      const breakdown = calculateHoursBreakdown(actualTimeIn, actualTimeOut);
                      
                      return (
                        <>
                          <br />
                          <strong>Hours Breakdown:</strong><br />
                          Total Hours: {breakdown.totalHours}<br />
                          Regular Hours: {breakdown.regularHours}<br />
                          Night Differential Hours: {breakdown.nightHours}<br />
                          <br />
                          <strong>Estimated Pay:</strong><br />
                          Regular Pay: ¥{Math.round(breakdown.regularHours * 1000).toLocaleString()}<br />
                          Night Pay: ¥{Math.round(breakdown.nightHours * 1250).toLocaleString()}<br />
                          Total Pay: ¥{Math.round(breakdown.regularHours * 1000 + breakdown.nightHours * 1250).toLocaleString()}
                        </>
                      );
                    } catch {
                      return 'Error calculating hours';
                    }
                  })()}
                </Typography>
              </Alert>
            )}
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={historyData.notes}
              onChange={(e) => setHistoryData({ ...historyData, notes: e.target.value })}
              disabled={submitting}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddHistoryDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleAddHistory} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Add Time Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialog} onClose={() => !submitting && setBulkImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Import Preview</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please review the data before importing. Times should be in 24-hour format (HH:mm).
          </Alert>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time In</TableCell>
                  <TableCell>Time Out</TableCell>
                  <TableCell>Est. Total Hours</TableCell>
                  <TableCell>Est. Regular Hours</TableCell>
                  <TableCell>Est. Night Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkImportData.map((entry, index) => {
                  const breakdown = (() => {
                    try {
                      const date = parse(entry.date, 'yyyy-MM-dd', new Date());
                      const [timeInHours, timeInMinutes] = entry.timeIn.split(':').map(Number);
                      const [timeOutHours, timeOutMinutes] = entry.timeOut.split(':').map(Number);
                      
                      const timeIn = new Date(date);
                      timeIn.setHours(timeInHours, timeInMinutes, 0, 0);
                      
                      let timeOut = new Date(date);
                      timeOut.setHours(timeOutHours, timeOutMinutes, 0, 0);
                      
                      if (timeOut <= timeIn) {
                        timeOut.setDate(timeOut.getDate() + 1);
                      }
                      
                      return calculateHoursBreakdown(timeIn, timeOut);
                    } catch {
                      return { totalHours: 0, regularHours: 0, nightHours: 0 };
                    }
                  })();
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.timeIn}</TableCell>
                      <TableCell>{entry.timeOut}</TableCell>
                      <TableCell>{breakdown.totalHours.toFixed(2)}</TableCell>
                      <TableCell>{breakdown.regularHours.toFixed(2)}</TableCell>
                      <TableCell>{breakdown.nightHours.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleBulkImport} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : `Import ${bulkImportData.length} Records`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for quick access */}
      {!submitting && (
        <Tooltip title={activeCard ? "Clock Out" : "Clock In"} placement="left">
          <Fab
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              width: 64,
              height: 64,
              background: activeCard 
                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                background: activeCard 
                  ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                  : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
            onClick={activeCard ? handleClockOut : handleClockIn}
          >
            {activeCard ? <LogoutIcon sx={{ fontSize: 28 }} /> : <LoginIcon sx={{ fontSize: 28 }} />}
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}