import express from 'express';
import Schedule from '../models/Schedule';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create schedule
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const schedule = new Schedule({
      ...req.body,
      userId
    });
    
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all schedules for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    
    let query: any = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const schedules = await Schedule.find(query).sort({ date: 1, startTime: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update schedule
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const schedule = await Schedule.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete schedule
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const result = await Schedule.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;