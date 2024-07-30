import Position from '../models/position.model.js';

class PositionController {
  // Crear un nuevo puesto
  async createPosition(req, res) {
    const { name, description, base_salary, daily_hours, period, work_days } = req.body;

    if (!name || !description || !base_salary || !daily_hours || !period || !work_days) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Verificar si el nombre del puesto ya existe
      const existingPosition = await Position.findOne({ name });
      if (existingPosition) {
        return res.status(400).json({ error: 'Ya existe un puesto con ese nombre.' });
      }

      // Crear un nuevo puesto
      const newPosition = new Position({ name, description, base_salary, daily_hours, period, work_days });
      await newPosition.save();
      res.status(201).json({ message: 'Puesto creado exitosamente', position: newPosition });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el puesto: ' + error.message });
    }
  }

  // Obtener todos los puestos
  async getAllPositions(req, res) {
    const { sortBy = 'name', order = 'asc' } = req.query;

    try {
      const positions = await Position.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(positions);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los puestos: ' + error.message });
    }
  }

  // Obtener un puesto por ID
  async getPositionById(req, res) {
    try {
      const position = await Position.findById(req.params.id);
      if (!position) return res.status(404).json({ message: 'Puesto no encontrado' });
      res.status(200).json(position);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el puesto: ' + error.message });
    }
  }

  // Obtener todos los puestos con paginación
  async getPositionsWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const positions = await Position.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalPositions = await Position.countDocuments();

      res.status(200).json({
        totalPositions,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalPositions / pageSize),
        positions
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los puestos: ' + error.message });
    }
  }

  // Buscar puestos por nombre o descripción
  async searchPositions(req, res) {
    const { query, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const positions = await Position.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(positions);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar puestos: ' + error.message });
    }
  }

  // Actualizar un puesto
  async updatePosition(req, res) {
    const { name, description, base_salary, daily_hours, period, work_days } = req.body;
    const positionId = req.params.id;

    try {
      const position = await Position.findById(positionId);
      if (!position) return res.status(404).json({ message: 'Puesto no encontrado' });

      const existingPosition = await Position.findOne({ name, _id: { $ne: positionId } });
      if (existingPosition) {
        return res.status(400).json({ error: 'El nombre del puesto ya está en uso. Por favor, elige otro nombre.' });
      }

      if (name) position.name = name;
      if (description) position.description = description;
      if (base_salary) position.base_salary = base_salary;
      if (daily_hours) position.daily_hours = daily_hours;
      if (period) position.period = period;
      if (work_days) position.work_days = work_days;

      await position.save();
      res.status(200).json({ message: 'Puesto actualizado exitosamente', position });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el puesto: ' + error.message });
    }
  }

  // Eliminar un puesto
  async deletePosition(req, res) {
    try {
      const position = await Position.findByIdAndDelete(req.params.id);
      if (!position) return res.status(404).json({ message: 'Puesto no encontrado' });

      res.status(200).json({ message: 'Puesto eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el puesto: ' + error.message });
    }
  }
}

export default new PositionController();