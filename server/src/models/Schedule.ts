import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'work' | 'meeting' | 'break' | 'holiday' | 'other';
  color?: string;
  recurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

const scheduleSchema = new Schema<ISchedule>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['work', 'meeting', 'break', 'holiday', 'other'],
    default: 'work'
  },
  color: String,
  recurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  }
}, {
  timestamps: true
});

export default mongoose.model<ISchedule>('Schedule', scheduleSchema);