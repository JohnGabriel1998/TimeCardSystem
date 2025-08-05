import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeCard extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  timeIn: Date;
  timeOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  nightShiftHours: number;
  regularPay: number;
  overtimePay: number;
  nightShiftPay: number;
  totalPay: number;
  status: 'active' | 'completed';
  notes?: string;
}

const timeCardSchema = new Schema<ITimeCard>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeIn: {
    type: Date,
    required: true
  },
  timeOut: Date,
  breakStart: Date,
  breakEnd: Date,
  totalHours: {
    type: Number,
    default: 0
  },
  regularHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  nightShiftHours: {
    type: Number,
    default: 0
  },
  regularPay: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  nightShiftPay: {
    type: Number,
    default: 0
  },
  totalPay: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  notes: String
}, {
  timestamps: true
});

export default mongoose.model<ITimeCard>('TimeCard', timeCardSchema);