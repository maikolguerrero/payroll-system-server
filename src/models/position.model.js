import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  base_salary: {
    type: Number,
    required: true
  },
  daily_hours: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    required: true
  },
  work_days: {
    type: [String],
    required: true
  }
});

const Position = mongoose.model('Position', positionSchema);
export default Position;