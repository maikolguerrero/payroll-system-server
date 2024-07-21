import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import companyRoutes from './routes/company.routes.js';
import departmentRoutes from './routes/department.routes.js';
import positionRoutes from './routes/position.routes.js';
import deductionRoutes from './routes/deduction.routes.js';
import perceptionRoutes from './routes/perception.routes.js';
import bankRoutes from './routes/bank.routes.js';
import bankAccountRoutes from './routes/bank.account.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import { upload } from './config/upload.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Definir __dirname en ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/deductions', deductionRoutes);
app.use('/api/perceptions', perceptionRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/banks_accounts', bankAccountRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/payrolls', payrollRoutes);

// Ruta para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    res.status(201).json({ file: req.file });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para manejar rutas no definidas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocurrió un error en el servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});