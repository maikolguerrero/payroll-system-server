import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  bank_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: true
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  account_number: {
    type: String,
    required: true
  },
  account_type: {
    type: String,
    required: true
  }
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

export default BankAccount