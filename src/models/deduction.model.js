import mongoose from 'mongoose';

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const Deduction = mongoose.model('Deduction', deductionSchema);
export default Deduction;