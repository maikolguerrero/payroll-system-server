import Deduction from '../models/deduction.model.js';

class DeductionController {
  // Crear una nueva deducción
  async createDeduction(req, res) {
    const { type, description, amount, date } = req.body;

    // Verificar que todos los campos obligatorios estén presentes
    if (!type || !description || !amount || !date) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Verificar si el tipo de deducción ya existe
      const existingDeduction = await Deduction.findOne({ type });
      if (existingDeduction) {
        return res.status(400).json({ error: 'Ya existe una deducción con ese tipo.' });
      }

      // Crear una nueva deducción
      const newDeduction = new Deduction({ type, description, amount, date });
      await newDeduction.save();
      res.status(201).json({ message: 'Deducción creada exitosamente', deduction: newDeduction });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la deducción: ' + error.message });
    }
  }

  // Obtener todas las deducciones
  async getAllDeductions(req, res) {
    const { sortBy = 'date', order = 'asc' } = req.query;

    try {
      const deductions = await Deduction.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(deductions);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las deducciones: ' + error.message });
    }
  }

  // Obtener una deducción por ID
  async getDeductionById(req, res) {
    try {
      const deduction = await Deduction.findById(req.params.id);
      if (!deduction) return res.status(404).json({ message: 'Deducción no encontrada' });
      res.status(200).json(deduction);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la deducción: ' + error.message });
    }
  }

  // Obtener todas las deducciones con paginación
  async getDeductionsWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'date', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const deductions = await Deduction.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalDeductions = await Deduction.countDocuments();

      res.status(200).json({
        totalDeductions,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalDeductions / pageSize),
        deductions
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las deducciones: ' + error.message });
    }
  }

  // Buscar deducciones por tipo, descripción o monto
  async searchDeductions(req, res) {
    const { query, sortBy = 'date', order = 'asc' } = req.query;

    try {
      const deductions = await Deduction.find({
        $or: [
          { type: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(deductions);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar las deducciones: ' + error.message });
    }
  }

  // Actualizar una deducción
  async updateDeduction(req, res) {
    const { type, description, amount, date } = req.body;
    const deductionId = req.params.id;

    try {
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) return res.status(404).json({ message: 'Deducción no encontrada' });

      // Verificar si el tipo de deducción con el nuevo valor ya existe (excluyendo el actual)
      const existingDeduction = await Deduction.findOne({ type, _id: { $ne: deductionId } });
      if (existingDeduction) {
        return res.status(400).json({ error: 'Ya existe una deducción con ese tipo.' });
      }

      if (type) deduction.type = type;
      if (description) deduction.description = description;
      if (amount) deduction.amount = amount;
      if (date) deduction.date = date;

      await deduction.save();
      res.status(200).json({ message: 'Deducción actualizada exitosamente', deduction });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la deducción: ' + error.message });
    }
  }

  // Eliminar una deducción
  async deleteDeduction(req, res) {
    try {
      const deduction = await Deduction.findByIdAndDelete(req.params.id);
      if (!deduction) return res.status(404).json({ message: 'Deducción no encontrada' });

      res.status(200).json({ message: 'Deducción eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la deducción: ' + error.message });
    }
  }
}

export default new DeductionController();