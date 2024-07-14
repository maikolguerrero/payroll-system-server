import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin_principal', 'admin_nomina'], required: true }, // Nuevo campo
});

const User = mongoose.model('User', userSchema);

export default User;