// models/employee.model.js
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  ci: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  surnames: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  birthdate: {
    type: Date
  },
  base_salary: {
    type: Number,
    required: true
  },
  hire_date: {
    type: Date,
    required: true
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: true
  },
  gender: {
    type: String,
    enum: ['Masculino', 'Femenino']
  }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;