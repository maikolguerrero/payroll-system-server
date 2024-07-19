import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;