import mongoose from 'mongoose';

const { Schema } = mongoose;

const payrollSchema = new Schema({
  employee_id: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  period: {
    type: String,
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  payment_date: {
    type: Date,
    required: true,
  },
  base_salary: {
    type: Number,
    required: true,
  },
  overtime_hours: {
    type: Number,
    default: 0,
  },
  deductions: [{
    type: Schema.Types.ObjectId,
    ref: 'Deduction',
  }],
  perceptions: [{
    type: Schema.Types.ObjectId,
    ref: 'Perception',
  }],
  gross_salary: {
    type: Number,
    required: true,
  },
  net_salary: {
    type: Number,
    required: true,
  },
  state: {
    type: String,
    enum: ['Generada', 'Pagada', 'Pendiente', 'Cancelada'],
    default: 'Pagada',
  },
}, { timestamps: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;