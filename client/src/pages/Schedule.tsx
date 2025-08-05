import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CardContent,
  IconButton,
  Chip,
  Paper,
  Avatar,
  alpha,
  Fab,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, CalendarMonth, Schedule as ScheduleIcon, ChevronLeft, ChevronRight, Today } from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';

interface ScheduleData {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'meeting' | 'break' | 'holiday' | 'other';
  color?: string;
}

const eventTypeColors = {
  work: '#1976d2',
  meeting: '#ff9800',
  break: '#4caf50',
  holiday: '#f44336',
  other: '#9c27b0',
};

const eventTypeLabels = {
  work: 'Work Shift',
  meeting: 'Meeting',
  break: 'Break Time',
  holiday: 'Holiday',
  other: 'Other Event',
};

export default function Schedule() {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [formData, setFormData] = useState({
    date: new Date(),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)), // 9:00 AM
    endTime: new Date(new Date().setHours(17, 0, 0, 0)), // 5:00 PM
    type: 'work' as 'work' | 'meeting' | 'break' | 'holiday' | 'other',
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
    }
  };

  // Calendar functions
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => {
      try {
        const scheduleDate = new Date(schedule.date);
        return isSameDay(scheduleDate, date);
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
    const isPast = date < new Date() && !isToday(date);
    const daySchedules = getSchedulesForDate(date);
    
    if (isPast && daySchedules.length > 0) {
      // Show summary modal for past dates with schedules
      setSelectedDate(date);
      setOpenSummaryDialog(true);
    } else {
      // Show add/edit modal for current/future dates or past dates without schedules
      setFormData({
        ...formData,
        date: date,
      });
      setOpenDialog(true);
    }
  };

  // Calculate work summary for a specific date
  const calculateWorkSummary = (date: Date) => {
    const daySchedules = getSchedulesForDate(date).filter(s => s.type === 'work');
    
    let totalHours = 0;
    let regularHours = 0;
    let nightDifferentialHours = 0;
    
    daySchedules.forEach(schedule => {
      // Fix date parsing - ensure proper date format
      const scheduleDate = schedule.date.includes('T') ? schedule.date.split('T')[0] : schedule.date;
      const startTime = new Date(`${scheduleDate}T${schedule.startTime}:00`);
      const endTime = new Date(`${scheduleDate}T${schedule.endTime}:00`);
      
      console.log('Processing schedule:', schedule);
      console.log('Start time:', startTime, 'End time:', endTime);
      
      // Calculate total hours
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      console.log('Calculated hours:', hours);
      
      // Ensure we have valid numbers
      if (isNaN(hours) || hours < 0) {
        console.error('Invalid hours calculation for schedule:', schedule);
        console.error('Start time:', startTime, 'End time:', endTime, 'Hours:', hours);
        return;
      }
      
      totalHours += hours;
      
      // Simple night differential calculation (22:00 - 06:00)
      const startHour = startTime.getHours();
      const endHour = endTime.getHours();
      
      let nightHours = 0;
      
      // Calculate night differential hours more accurately
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const currentHour = currentTime.getHours();
        
        // Night hours are from 22:00 to 05:59 (next day)
        if (currentHour >= 22 || currentHour < 6) {
          // Calculate how much of this hour is within the shift
          const nextHour = new Date(currentTime);
          nextHour.setHours(currentHour + 1, 0, 0, 0);
          
          const hourEnd = nextHour > endTime ? endTime : nextHour;
          const hourDuration = (hourEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
          
          nightHours += hourDuration;
        }
        
        // Move to next hour
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      }
      
      console.log(`Night differential hours for ${schedule.startTime}-${schedule.endTime}: ${nightHours}`);
      nightDifferentialHours += nightHours;
    });
    
    // Ensure regularHours is never negative
    regularHours = Math.max(0, totalHours - nightDifferentialHours);
    
    // Calculate pay with Japanese Yen rates
    const regularRate = 1000; // ¥1000 per hour (regular time)
    const nightDifferentialRate = 1250; // ¥1250 per hour (22:00 and later)
    
    const regularPay = regularHours * regularRate;
    const nightDifferentialPay = nightDifferentialHours * nightDifferentialRate;
    const totalPay = regularPay + nightDifferentialPay;
    
    // Ensure all values are valid numbers
    const result = {
      totalHours: isNaN(totalHours) ? 0 : Math.round(totalHours * 100) / 100,
      regularHours: isNaN(regularHours) ? 0 : Math.round(regularHours * 100) / 100,
      nightDifferentialHours: isNaN(nightDifferentialHours) ? 0 : Math.round(nightDifferentialHours * 100) / 100,
      regularPay: isNaN(regularPay) ? 0 : Math.round(regularPay),
      nightDifferentialPay: isNaN(nightDifferentialPay) ? 0 : Math.round(nightDifferentialPay),
      totalPay: isNaN(totalPay) ? 0 : Math.round(totalPay),
      schedules: daySchedules
    };
    
    console.log('Work summary calculation result:', result);
    return result;
  };

  const handleEdit = (schedule: ScheduleData) => {
    setSelectedSchedule(schedule);
    setFormData({
      date: new Date(schedule.date),
      startTime: new Date(`${schedule.date}T${schedule.startTime}`),
      endTime: new Date(`${schedule.date}T${schedule.endTime}`),
      type: schedule.type,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      // Validate that start time is before end time
      if (formData.startTime >= formData.endTime) {
        toast.error('Start time must be before end time');
        return;
      }

      const scheduleData = {
        title: eventTypeLabels[formData.type],
        description: '',
        date: format(formData.date, 'yyyy-MM-dd'),
        startTime: format(formData.startTime, 'HH:mm'),
        endTime: format(formData.endTime, 'HH:mm'),
        type: formData.type,
        color: eventTypeColors[formData.type],
      };

      console.log('Submitting schedule data:', scheduleData);

      let response;
      if (selectedSchedule) {
        response = await axios.put(`/api/schedules/${selectedSchedule._id}`, scheduleData);
        toast.success('Schedule updated successfully!');
      } else {
        response = await axios.post('/api/schedules', scheduleData);
        toast.success('Schedule created successfully!');
      }

      console.log('Server response:', response.data);
      fetchSchedules();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      
      if (error.response) {
        // Server responded with an error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        toast.error(`Failed to save schedule: ${errorMessage}`);
        console.error('Server error details:', error.response.data);
      } else if (error.request) {
        // Network error
        toast.error('Network error: Could not connect to server. Please check if the server is running.');
      } else {
        // Other error
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await axios.delete(`/api/schedules/${id}`);
      toast.success('Schedule deleted successfully!');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    setFormData({
      date: new Date(),
      startTime: new Date(new Date().setHours(9, 0, 0, 0)), // 9:00 AM
      endTime: new Date(new Date().setHours(17, 0, 0, 0)), // 5:00 PM
      type: 'work' as 'work' | 'meeting' | 'break' | 'holiday' | 'other',
    });
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
                <ScheduleIcon sx={{ fontSize: 30 }} />
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
                  Schedule Memo
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Plan your work schedule for upcoming months
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1rem',
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
              Add Schedule
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Monthly Summary Card */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
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
                    {format(currentMonth, 'MMMM yyyy')} Summary
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                {(() => {
                  const monthSchedules = schedules.filter(s => {
                    const scheduleDate = new Date(s.date);
                    return scheduleDate.getMonth() === currentMonth.getMonth() && 
                           scheduleDate.getFullYear() === currentMonth.getFullYear();
                  });

                  const summary = monthSchedules.reduce((acc, schedule) => {
                    acc[schedule.type] = (acc[schedule.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        📊 Total Events: {monthSchedules.length}
                      </Typography>
                      
                      {Object.entries(summary).map(([type, count]) => (
                        <Paper
                          key={type}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 3,
                            background: alpha(eventTypeColors[type as keyof typeof eventTypeColors], 0.1),
                            border: '1px solid',
                            borderColor: alpha(eventTypeColors[type as keyof typeof eventTypeColors], 0.2),
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {eventTypeLabels[type as keyof typeof eventTypeLabels]}
                            </Typography>
                            <Chip
                              label={`${count} days`}
                              size="small"
                              sx={{
                                backgroundColor: eventTypeColors[type as keyof typeof eventTypeColors],
                                color: 'white',
                                borderRadius: 2,
                              }}
                            />
                          </Box>
                        </Paper>
                      ))}

                      {monthSchedules.length === 0 && (
                        <Box textAlign="center" py={3}>
                          <Typography color="text.secondary">
                            No schedules planned for this month
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </CardContent>
            </Paper>
          </motion.div>
        </Grid>

        {/* Calendar View */}
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
              }}
            >
              {/* Calendar Header */}
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <IconButton
                    onClick={handlePreviousMonth}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </Typography>
                  
                  <IconButton
                    onClick={handleNextMonth}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Days of week header */}
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

                {/* Calendar Grid */}
                <Grid container spacing={1}>
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getDay(monthStart) }).map((_, index) => (
                    <Grid item xs={12/7} key={`empty-${index}`}>
                      <Box minHeight={120} />
                    </Grid>
                  ))}
                  
                  {/* Calendar days */}
                  {monthDays.map(date => {
                    const daySchedules = getSchedulesForDate(date);
                    const isPast = date < new Date() && !isToday(date);
                    
                    return (
                      <Grid item xs={12/7} key={date.toISOString()}>
                        <Paper
                          onClick={() => handleDateClick(date)}
                          elevation={0}
                          sx={{
                            p: 2,
                            minHeight: 120,
                            cursor: 'pointer',
                            borderRadius: 3,
                            background: isToday(date) 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                              : isPast
                                ? 'rgba(0, 0, 0, 0.03)'
                                : 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid',
                            borderColor: isToday(date) 
                              ? '#667eea'
                              : daySchedules.length > 0
                                ? alpha('#667eea', 0.3)
                                : alpha('#000', 0.1),
                            color: isToday(date) ? 'white' : 'inherit',
                            opacity: isPast ? 0.8 : 1,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                              borderColor: '#667eea',
                              opacity: 1,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: isToday(date) ? 700 : daySchedules.length > 0 ? 600 : 'normal',
                              mb: 1,
                              color: isToday(date) ? 'white' : 'text.primary',
                              opacity: isToday(date) ? 1 : isPast ? 0.6 : 1,
                            }}
                          >
                            {format(date, 'd')}
                          </Typography>
                          
                          {daySchedules.slice(0, 2).map((schedule, index) => (
                            <Chip
                              key={schedule._id}
                              size="small"
                              label={schedule.type}
                              sx={{ 
                                mb: 0.5,
                                width: '100%',
                                fontSize: '0.7rem',
                                borderRadius: 2,
                                backgroundColor: eventTypeColors[schedule.type],
                                color: 'white',
                                opacity: isPast ? 0.8 : 1,
                              }}
                            />
                          ))}
                          
                          {daySchedules.length > 2 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isToday(date) ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                                fontSize: '0.7rem',
                              }}
                            >
                              +{daySchedules.length - 2} more
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Quick Actions & Today's Schedule */}
        <Grid item xs={12}>
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
                    <Today />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Today's Schedule - {format(new Date(), 'EEEE, MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {(() => {
                  const todaySchedules = getSchedulesForDate(new Date());
                  
                  if (todaySchedules.length === 0) {
                    return (
                      <Box textAlign="center" py={3}>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          No schedules for today
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => {
                            setFormData({ 
                              date: new Date(),
                              startTime: new Date(new Date().setHours(9, 0, 0, 0)),
                              endTime: new Date(new Date().setHours(17, 0, 0, 0)),
                              type: 'work'
                            });
                            setOpenDialog(true);
                          }}
                          sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': {
                              borderColor: '#5a6fd8',
                              backgroundColor: alpha('#667eea', 0.1),
                            },
                          }}
                        >
                          Add Today's Schedule
                        </Button>
                      </Box>
                    );
                  }

                  return (
                    <Grid container spacing={2}>
                      {todaySchedules.map((schedule) => (
                        <Grid item xs={12} sm={6} md={4} key={schedule._id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              background: alpha(eventTypeColors[schedule.type], 0.1),
                              border: '1px solid',
                              borderColor: alpha(eventTypeColors[schedule.type], 0.2),
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 25px ${alpha(eventTypeColors[schedule.type], 0.15)}`,
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {schedule.title}
                              </Typography>
                              <Chip
                                label={schedule.type}
                                size="small"
                                sx={{
                                  backgroundColor: eventTypeColors[schedule.type],
                                  color: 'white',
                                  borderRadius: 2,
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              🕐 {schedule.startTime} - {schedule.endTime}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(schedule)}
                                sx={{
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
                                onClick={() => handleDelete(schedule._id)}
                                sx={{
                                  color: '#f44336',
                                  '&:hover': {
                                    backgroundColor: alpha('#f44336', 0.1),
                                  },
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  );
                })()}
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Simplified Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {selectedSchedule ? 'Edit Schedule' : `Add Schedule - ${format(formData.date, 'MMM dd, yyyy')}`}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Event Type"
              select
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
              <MenuItem value="work">🏢 Work Shift</MenuItem>
              <MenuItem value="meeting">💼 Meeting</MenuItem>
              <MenuItem value="break">☕ Break Time</MenuItem>
              <MenuItem value="holiday">🏖️ Holiday</MenuItem>
              <MenuItem value="other">📅 Other Event</MenuItem>
            </TextField>

            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => newValue && setFormData({ ...formData, date: newValue })}
              sx={{ 
                mb: 3, 
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(newValue) => newValue && setFormData({ ...formData, startTime: newValue })}
                  ampm={false}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(newValue) => newValue && setFormData({ ...formData, endTime: newValue })}
                  ampm={false}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          {selectedSchedule && (
            <Button 
              onClick={() => handleDelete(selectedSchedule._id)} 
              sx={{
                color: '#f44336',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha('#f44336', 0.1),
                },
              }}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            {selectedSchedule ? 'Update' : 'Add Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Summary Dialog for Past Dates */}
      <Dialog 
        open={openSummaryDialog} 
        onClose={() => setOpenSummaryDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        {selectedDate && (() => {
          const workSummary = calculateWorkSummary(selectedDate);
          const isPastDate = selectedDate < new Date() && !isToday(selectedDate);
          
          return (
            <>
              <DialogTitle
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  color: 'white',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Typography variant="h6" sx={{ mr: 1 }}>
                    ✅ Your Shift is Finished!
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                </Typography>
              </DialogTitle>
              
              <DialogContent sx={{ p: 4 }}>
                {workSummary.schedules.length > 0 ? (
                  <Box>
                    {/* Work Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={4}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                            color: 'white',
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {workSummary.totalHours || 0}h
                          </Typography>
                          <Typography variant="subtitle1">
                            Total Hours Worked
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                            color: 'white',
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Regular: {workSummary.regularHours || 0}h
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Night Diff: {workSummary.nightDifferentialHours || 0}h
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                            color: 'white',
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            ¥{(workSummary.totalPay || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="subtitle1">
                            Total Earnings
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Detailed Breakdown */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: alpha('#667eea', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#667eea', 0.2),
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#667eea' }}>
                        💰 Pay Breakdown
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="body1">
                              Regular Hours ({workSummary.regularHours || 0}h × ¥1,000)
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              ¥{(workSummary.regularPay || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="body1">
                              Night Differential ({workSummary.nightDifferentialHours || 0}h × ¥1,250)
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              ¥{(workSummary.nightDifferentialPay || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ borderTop: '2px solid #667eea', pt: 2, mt: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Total Earnings
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                            ¥{(workSummary.totalPay || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Schedule Details */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        📋 Work Schedule Details
                      </Typography>
                      
                      {workSummary.schedules.map((schedule, index) => (
                        <Box 
                          key={schedule._id}
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 2,
                            background: alpha(eventTypeColors[schedule.type], 0.1),
                            border: '1px solid',
                            borderColor: alpha(eventTypeColors[schedule.type], 0.2),
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {schedule.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                🕐 {schedule.startTime} - {schedule.endTime}
                              </Typography>
                            </Box>
                            <Chip
                              label={schedule.type}
                              size="small"
                              sx={{
                                backgroundColor: eventTypeColors[schedule.type],
                                color: 'white',
                                borderRadius: 2,
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      No work schedules found for this date
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        setOpenSummaryDialog(false);
                        setFormData({
                          ...formData,
                          date: selectedDate,
                        });
                        setOpenDialog(true);
                      }}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a6fd8',
                          backgroundColor: alpha('#667eea', 0.1),
                        },
                      }}
                    >
                      Add Schedule for This Date
                    </Button>
                  </Box>
                )}
              </DialogContent>
              
              <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button 
                  onClick={() => setOpenSummaryDialog(false)}
                  sx={{
                    borderRadius: 2,
                    color: 'text.secondary',
                  }}
                >
                  Close
                </Button>
                {workSummary.schedules.length > 0 && (
                  <Button 
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => {
                      setOpenSummaryDialog(false);
                      setFormData({
                        ...formData,
                        date: selectedDate,
                      });
                      setOpenDialog(true);
                    }}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    Edit Schedule
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Floating Action Button */}
      <Tooltip title="Add New Schedule" placement="left">
        <Fab
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
          onClick={() => setOpenDialog(true)}
        >
          <Add sx={{ fontSize: 28 }} />
        </Fab>
      </Tooltip>
    </Box>
  );
}