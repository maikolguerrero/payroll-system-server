import mongoose from 'mongoose';

const perceptionSchema = new mongoose.Schema({
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

const Perception = mongoose.model('Perception', perceptionSchema);
export default Perception;