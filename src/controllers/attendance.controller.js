import Attendance from '../models/attendance.model.js';

class AttendanceController {
  // Crear una nueva asistencia
  async createAttendance(req, res) {
    const { employee_id, date, entry_time, exit_time } = req.body;

    // Verificar que todos los campos obligatorios estén presentes
    if (!employee_id || !date || !entry_time || !exit_time) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Calcular las horas trabajadas
      const entryDate = new Date(`${date}T${entry_time}:00`);
      const exitDate = new Date(`${date}T${exit_time}:00`);
      const hoursWorked = (exitDate - entryDate) / (1000 * 60 * 60); // Convertir de milisegundos a horas

      const newAttendance = new Attendance({
        employee_id,
        date,
        entry_time,
        exit_time,
        hours_worked: hoursWorked
      });
      await newAttendance.save();
      res.status(201).json({ message: 'Asistencia creada exitosamente', attendance: newAttendance });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la asistencia: ' + error.message });
    }
  }

  // Obtener todas las asistencias
  async getAllAttendances(req, res) {
    const { sortBy = 'date', order = 'asc' } = req.query;

    try {
      const attendances = await Attendance.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las asistencias: ' + error.message });
    }
  }

  // Obtener una asistencia por ID
  async getAttendanceById(req, res) {
    try {
      const attendance = await Attendance.findById(req.params.id);
      if (!attendance) return res.status(404).json({ message: 'Asistencia no encontrada' });
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la asistencia: ' + error.message });
    }
  }

  // Obtener todas las asistencias con paginación
  async getAttendancesWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'date', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const attendances = await Attendance.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalAttendances = await Attendance.countDocuments();

      res.status(200).json({
        totalAttendances,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalAttendances / pageSize),
        attendances
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las asistencias: ' + error.message });
    }
  }

  // Obtener asistencias por fecha
  async getAttendancesByDate(req, res) {
    const { date } = req.params;

    try {
      const attendances = await Attendance.find({ date });
      res.status(200).json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las asistencias: ' + error.message });
    }
  }

  // Obtener asistencias por empleado
  async getAttendancesByEmployee(req, res) {
    const { employee_id } = req.params;

    try {
      const attendances = await Attendance.find({ employee_id });
      res.status(200).json(attendances);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las asistencias: ' + error.message });
    }
  }

  // Actualizar una asistencia
  async updateAttendance(req, res) {
    const { employee_id, date, entry_time, exit_time } = req.body;
    const attendanceId = req.params.id;

    try {
      const attendance = await Attendance.findById(attendanceId);
      if (!attendance) return res.status(404).json({ message: 'Asistencia no encontrada' });

      if (employee_id) attendance.employee_id = employee_id;
      if (date) attendance.date = date;
      if (entry_time) attendance.entry_time = entry_time;
      if (exit_time) attendance.exit_time = exit_time;

      // Recalcular las horas trabajadas si se actualizan las horas de entrada o salida
      if (entry_time && exit_time) {
        const entryDate = new Date(`${date}T${entry_time}:00`);
        const exitDate = new Date(`${date}T${exit_time}:00`);
        attendance.hours_worked = (exitDate - entryDate) / (1000 * 60 * 60);
      }

      await attendance.save();
      res.status(200).json({ message: 'Asistencia actualizada exitosamente', attendance });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la asistencia: ' + error.message });
    }
  }

  // Eliminar una asistencia
  async deleteAttendance(req, res) {
    try {
      const attendance = await Attendance.findByIdAndDelete(req.params.id);
      if (!attendance) return res.status(404).json({ message: 'Asistencia no encontrada' });

      res.status(200).json({ message: 'Asistencia eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la asistencia: ' + error.message });
    }
  }
}

export default new AttendanceController();