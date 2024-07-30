import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  bank_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true }
});

const File = mongoose.model('File', fileSchema);

export default File;