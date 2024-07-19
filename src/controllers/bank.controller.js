import Bank from '../models/bank.model.js';

class BankController {
  // Crear un nuevo banco
  async createBank(req, res) {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      const existingCode = await Bank.findOne({ code });
      if (existingCode) {
        return res.status(400).json({ error: 'Ya existe ese código.' });
      }

      const newBank = new Bank({ name, code });
      await newBank.save();
      res.status(201).json({ message: 'Banco creado exitosamente', bank: newBank });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el banco: ' + error.message });
    }
  }

  // Obtener todos los bancos
  async getAllBanks(req, res) {
    const { sortBy = 'name', order = 'asc' } = req.query;

    try {
      const banks = await Bank.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(banks);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los bancos: ' + error.message });
    }
  }

  // Obtener un banco por ID
  async getBankById(req, res) {
    try {
      const bank = await Bank.findById(req.params.id);
      if (!bank) return res.status(404).json({ message: 'Banco no encontrado' });
      res.status(200).json(bank);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el banco: ' + error.message });
    }
  }

  // Obtener todos los bancos con paginación
  async getBanksWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const banks = await Bank.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalBanks = await Bank.countDocuments();

      res.status(200).json({
        totalBanks,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalBanks / pageSize),
        banks
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los bancos: ' + error.message });
    }
  }

  // Buscar bancos por todos los campos
  async searchBanks(req, res) {
    const { query, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const banks = await Bank.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } }
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(banks);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar los bancos: ' + error.message });
    }
  }

  // Actualizar un banco
  async updateBank(req, res) {
    const { name, code } = req.body;
    const bankId = req.params.id;

    try {
      const bank = await Bank.findById(bankId);
      if (!bank) return res.status(404).json({ message: 'Banco no encontrado' });

      const existingCode = await Bank.findOne({ code, _id: { $ne: bankId } });
      if (existingCode) {
        return res.status(400).json({ error: 'Ya existe ese código.' });
      }

      if (name) bank.name = name;
      if (code) bank.code = code;

      await bank.save();
      res.status(200).json({ message: 'Banco actualizado exitosamente', bank });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el banco: ' + error.message });
    }
  }

  // Eliminar un banco
  async deleteBank(req, res) {
    try {
      const bank = await Bank.findByIdAndDelete(req.params.id);
      if (!bank) return res.status(404).json({ message: 'Banco no encontrado' });

      res.status(200).json({ message: 'Banco eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el banco: ' + error.message });
    }
  }
}

export default new BankController();