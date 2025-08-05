import express from 'express';
import { format, differenceInMinutes, parseISO, startOfDay } from 'date-fns';
import TimeCard from '../models/TimeCard';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Calculate pay based on hours worked
const calculatePay = (timeIn: Date, timeOut: Date) => {
  const totalMinutes = differenceInMinutes(timeOut, timeIn);
  const totalHours = totalMinutes / 60;
  
  // If no time worked, return zeros
  if (totalHours <= 0) {
    return {
      totalHours: 0,
      regularHours: 0,
      nightShiftHours: 0,
      regularPay: 0,
      nightShiftPay: 0,
      totalPay: 0
    };
  }
  
  let regularHours = 0;
  let nightShiftHours = 0;
  
  // Create a copy of timeIn to iterate through hours
  const currentTime = new Date(timeIn);
  
  while (currentTime < timeOut) {
    const hour = currentTime.getHours();
    const minutesRemaining = Math.min(60, differenceInMinutes(timeOut, currentTime));
    const hoursToAdd = minutesRemaining / 60;
    
    // Night shift is after 10 PM (22:00) or before 6 AM
    if (hour >= 22 || hour < 6) {
      nightShiftHours += hoursToAdd;
    } else {
      regularHours += hoursToAdd;
    }
    
    // Move to next hour
    currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
  }
  
  const regularPay = Math.round(regularHours * 1000);
  const nightShiftPay = Math.round(nightShiftHours * 1250);
  const totalPay = regularPay + nightShiftPay;
  
  return {
    totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    regularHours: Math.round(regularHours * 100) / 100,
    nightShiftHours: Math.round(nightShiftHours * 100) / 100,
    regularPay,
    nightShiftPay,
    totalPay
  };
};

// Add historical time card - FIXED VERSION
router.post('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { date, timeIn, timeOut, notes } = req.body;
    
    if (!date || !timeIn || !timeOut) {
      return res.status(400).json({ error: 'Date, time in, and time out are required' });
    }
    
    // Parse the ISO strings
    const workDate = parseISO(date);
    const timeInDate = parseISO(timeIn);
    const timeOutDate = parseISO(timeOut);
    
    // Calculate hours and pay
    const payData = calculatePay(timeInDate, timeOutDate);
    
    // Create a COMPLETED time card directly (not active)
    const timeCard = new TimeCard({
      userId,
      date: startOfDay(workDate),
      timeIn: timeInDate,
      timeOut: timeOutDate,
      status: 'completed', // Set as completed directly
      notes,
      ...payData
    });
    
    await timeCard.save();
    res.status(201).json(timeCard);
  } catch (error) {
    console.error('Error creating historical time card:', error);
    res.status(500).json({ error: 'Server error: ' + (error as Error).message });
  }
});

// Clock in - only for current time
router.post('/clockin', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { notes } = req.body;
    
    // Check if there's an active time card
    const activeCard = await TimeCard.findOne({
      userId,
      status: 'active'
    });
    
    if (activeCard) {
      return res.status(400).json({ error: 'You already have an active time card' });
    }
    
    const now = new Date();
    const timeCard = new TimeCard({
      userId,
      date: startOfDay(now),
      timeIn: now,
      notes,
      status: 'active',
      totalHours: 0,
      regularHours: 0,
      nightShiftHours: 0,
      regularPay: 0,
      nightShiftPay: 0,
      totalPay: 0
    });
    
    await timeCard.save();
    res.status(201).json(timeCard);
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clock out - only for current active time card
router.post('/clockout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { notes } = req.body;
    
    const activeCard = await TimeCard.findOne({
      userId,
      status: 'active'
    });
    
    if (!activeCard) {
      return res.status(400).json({ error: 'No active time card found' });
    }
    
    const now = new Date();
    activeCard.timeOut = now;
    activeCard.status = 'completed';
    if (notes) activeCard.notes = notes;
    
    // Calculate hours and pay
    const payData = calculatePay(activeCard.timeIn, activeCard.timeOut);
    Object.assign(activeCard, payData);
    
    await activeCard.save();
    res.json(activeCard);
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all time cards for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    
    let query: any = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: parseISO(startDate as string),
        $lte: parseISO(endDate as string)
      };
    }
    
    const timeCards = await TimeCard.find(query).sort({ date: -1 });
    res.json(timeCards);
  } catch (error) {
    console.error('Error fetching time cards:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update time card
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;
    
    const timeCard = await TimeCard.findOne({ _id: id, userId });
    
    if (!timeCard) {
      return res.status(404).json({ error: 'Time card not found' });
    }
    
    // If updating time in/out, recalculate pay
    if (updates.timeIn || updates.timeOut) {
      const timeIn = updates.timeIn ? parseISO(updates.timeIn) : timeCard.timeIn;
      const timeOut = updates.timeOut ? parseISO(updates.timeOut) : timeCard.timeOut;
      
      if (timeOut) {
        const payData = calculatePay(timeIn, timeOut);
        Object.assign(updates, payData);
        updates.status = 'completed';
      }
    }
    
    Object.assign(timeCard, updates);
    await timeCard.save();
    
    res.json(timeCard);
  } catch (error) {
    console.error('Error updating time card:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete time card
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const result = await TimeCard.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Time card not found' });
    }
    
    res.json({ message: 'Time card deleted successfully' });
  } catch (error) {
    console.error('Error deleting time card:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;