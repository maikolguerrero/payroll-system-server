import express from 'express';
import AttendanceController from '../controllers/attendance.controller.js';

const router = express.Router();

// Rutas para asistencias
router.post('/', AttendanceController.createAttendance);
router.get('/all', AttendanceController.getAllAttendances);
router.get('/', AttendanceController.getAttendancesWithPagination);
router.get('/date/:date', AttendanceController.getAttendancesByDate);
router.get('/employee/:employee_id', AttendanceController.getAttendancesByEmployee);
router.get('/:id', AttendanceController.getAttendanceById);
router.put('/:id', AttendanceController.updateAttendance);
router.delete('/:id', AttendanceController.deleteAttendance);

export default router;