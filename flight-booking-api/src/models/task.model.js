const mongoose = require('mongoose');
const { TASK_STATUS, TASK_CATEGORIES } = require('../constants/task-status');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: Object.values(TASK_CATEGORIES),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TASK_STATUS),
    default: TASK_STATUS.TODO
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: Date,
  completedAt: Date,
  // Link to booking if this task is related to a booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  tags: [{
    type: String,
    trim: true
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms']
    },
    scheduledAt: Date,
    sent: { type: Boolean, default: false }
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

// Indexes for performance (as per flight_plan.md section 4)
taskSchema.index({ user: 1, createdAt: -1 });  // Primary list query
taskSchema.index({ user: 1, status: 1 });      // Filter by status
taskSchema.index({ user: 1, category: 1 });    // Filter by category
taskSchema.index({ user: 1 });                 // Legacy support
taskSchema.index({ status: 1 });               // Global status queries
taskSchema.index({ category: 1 });             // Global category queries
taskSchema.index({ dueDate: 1 });              // Due date sorting

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return this.status !== TASK_STATUS.COMPLETED && new Date() > this.dueDate;
});

// Auto-set completedAt when status changes to completed
taskSchema.pre('save', function() {
  if (this.isModified('status')) {
    if (this.status === TASK_STATUS.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TASK_STATUS.COMPLETED) {
      this.completedAt = undefined;
    }
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;