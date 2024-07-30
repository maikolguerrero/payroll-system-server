import Perception from '../models/perception.model.js';

class PerceptionController {
  // Crear una nueva percepción
  async createPerception(req, res) {
    const { type, description, amount, date } = req.body;

    // Verificar que todos los campos obligatorios estén presentes
    if (!type || !description || !amount || !date) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Verificar si el tipo de percepción ya existe
      const existingPerception = await Perception.findOne({ type });
      if (existingPerception) {
        return res.status(400).json({ error: 'Ya existe una percepción con ese tipo.' });
      }

      // Crear una nueva percepción
      const newPerception = new Perception({ type, description, amount, date });
      await newPerception.save();
      res.status(201).json({ message: 'Percepción creada exitosamente', perception: newPerception });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la percepción: ' + error.message });
    }
  }

  // Obtener todas las percepciones
  async getAllPerceptions(req, res) {
    const { sortBy = 'date', order = 'asc' } = req.query;

    try {
      const perceptions = await Perception.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(perceptions);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las percepciones: ' + error.message });
    }
  }

  // Obtener una percepción por ID
  async getPerceptionById(req, res) {
    try {
      const perception = await Perception.findById(req.params.id);
      if (!perception) return res.status(404).json({ message: 'Percepción no encontrada' });
      res.status(200).json(perception);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la percepción: ' + error.message });
    }
  }

  // Obtener todas las percepciones con paginación
  async getPerceptionsWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'date', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const perceptions = await Perception.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalPerceptions = await Perception.countDocuments();

      res.status(200).json({
        totalPerceptions,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalPerceptions / pageSize),
        perceptions
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las percepciones: ' + error.message });
    }
  }

  // Buscar percepciones por tipo o descripción
  async searchPerceptions(req, res) {
    const { query, sortBy = 'date', order = 'asc' } = req.query;

    try {
      const perceptions = await Perception.find({
        $or: [
          { type: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(perceptions);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar las percepciones: ' + error.message });
    }
  }

  // Actualizar una percepción
  async updatePerception(req, res) {
    const { type, description, amount, date } = req.body;
    const perceptionId = req.params.id;

    try {
      const perception = await Perception.findById(perceptionId);
      if (!perception) return res.status(404).json({ message: 'Percepción no encontrada' });

      // Verificar si el tipo de percepción con el nuevo valor ya existe (excluyendo el actual)
      const existingPerception = await Perception.findOne({ type, _id: { $ne: perceptionId } });
      if (existingPerception) {
        return res.status(400).json({ error: 'Ya existe una percepción con ese tipo.' });
      }

      if (type) perception.type = type;
      if (description) perception.description = description;
      if (amount) perception.amount = amount;
      if (date) perception.date = date;

      await perception.save();
      res.status(200).json({ message: 'Percepción actualizada exitosamente', perception });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la percepción: ' + error.message });
    }
  }

  // Eliminar una percepción
  async deletePerception(req, res) {
    try {
      const perception = await Perception.findByIdAndDelete(req.params.id);
      if (!perception) return res.status(404).json({ message: 'Percepción no encontrada' });

      res.status(200).json({ message: 'Percepción eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la percepción: ' + error.message });
    }
  }
}

export default new PerceptionController();