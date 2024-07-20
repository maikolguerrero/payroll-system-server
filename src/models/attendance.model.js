import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' },
  date: { type: Date, required: true },
  entry_time: { type: String, required: true },
  exit_time: { type: String, required: true },
  hours_worked: { type: Number, required: true },
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;