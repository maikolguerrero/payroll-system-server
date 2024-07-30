import BankAccount from '../models/bank.account.model.js';
import Bank from '../models/bank.model.js';
import Employee from '../models/employee.model.js';

class BankAccountController {
  // Crear una nueva cuenta bancaria
  async createBankAccount(req, res) {
    const { bank_id, account_number, employee_id, account_type } = req.body;

    if (!bank_id || !account_number || !employee_id || !account_type) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Verificar si el banco existe
      const bankExists = await Bank.findById(bank_id);
      if (!bankExists) {
        return res.status(400).json({ error: 'El banco especificado no existe.' });
      }

      // Verificar si el empleado existe
      const employeeExists = await Employee.findById(employee_id);
      if (!employeeExists) {
        return res.status(400).json({ error: 'El empleado especificado no existe.' });
      }

      // Verificar si el número de cuenta ya existe en el banco
      const existingAccountNumber = await BankAccount.findOne({ bank_id, account_number });
      if (existingAccountNumber) {
        return res.status(400).json({ error: 'Ya existe una cuenta con ese número en el banco.' });
      }

      const newBankAccount = new BankAccount({ bank_id, employee_id, account_number, account_type });
      await newBankAccount.save();
      res.status(201).json({ message: 'Cuenta bancaria creada exitosamente', bankAccount: newBankAccount });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la cuenta bancaria: ' + error.message });
    }
  }

  // Obtener todas las cuentas bancarias
  async getAllBankAccounts(req, res) {
    const { sortBy = 'account_number', order = 'asc' } = req.query;

    try {
      const bankAccounts = await BankAccount.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(bankAccounts);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las cuentas bancarias: ' + error.message });
    }
  }

  // Obtener una cuenta bancaria por ID
  async getBankAccountById(req, res) {
    try {
      const bankAccount = await BankAccount.findById(req.params.id);
      if (!bankAccount) return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
      res.status(200).json(bankAccount);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la cuenta bancaria: ' + error.message });
    }
  }

  // Obtener todas las cuentas bancarias con paginación
  async getBankAccountsWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'account_number', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const bankAccounts = await BankAccount.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalBankAccounts = await BankAccount.countDocuments();

      res.status(200).json({
        totalBankAccounts,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalBankAccounts / pageSize),
        bankAccounts
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las cuentas bancarias: ' + error.message });
    }
  }

  // Buscar cuentas bancarias por todos los campos
  async searchBankAccounts(req, res) {
    const { query, sortBy = 'account_number', order = 'asc' } = req.query;

    try {
      const bankAccounts = await BankAccount.find({
        $or: [
          { account_number: { $regex: query, $options: 'i' } },
          { account_type: { $regex: query, $options: 'i' } }
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(bankAccounts);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar las cuentas bancarias: ' + error.message });
    }
  }

  // Actualizar una cuenta bancaria
  async updateBankAccount(req, res) {
    const { bank_id, account_number, employee_id, account_type } = req.body;
    const bankAccountId = req.params.id;

    try {
      const bankAccount = await BankAccount.findById(bankAccountId);
      if (!bankAccount) return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });

      // Verificar si el banco existe
      if (bank_id) {
        const bankExists = await Bank.findById(bank_id);
        if (!bankExists) {
          return res.status(400).json({ error: 'El banco especificado no existe.' });
        }
      }

      // Verificar si el empleado existe
      if (employee_id) {
        const employeeExists = await Employee.findById(employee_id);
        if (!employeeExists) {
          return res.status(400).json({ error: 'El empleado especificado no existe.' });
        }
      }

      // Verificar si el número de cuenta ya existe en el banco
      if (account_number) {
        const existingAccountNumber = await BankAccount.findOne({ bank_id, account_number, _id: { $ne: bankAccountId } });
        if (existingAccountNumber) {
          return res.status(400).json({ error: 'Ya existe una cuenta con ese número en el banco.' });
        }
      }

      if (bank_id) bankAccount.bank_id = bank_id;
      if (account_number) bankAccount.account_number = account_number;
      if (employee_id) bankAccount.employee_id = employee_id;
      if (account_type) bankAccount.account_type = account_type;

      await bankAccount.save();
      res.status(200).json({ message: 'Cuenta bancaria actualizada exitosamente', bankAccount });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la cuenta bancaria: ' + error.message });
    }
  }

  // Eliminar una cuenta bancaria
  async deleteBankAccount(req, res) {
    try {
      const bankAccount = await BankAccount.findByIdAndDelete(req.params.id);
      if (!bankAccount) return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });

      res.status(200).json({ message: 'Cuenta bancaria eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la cuenta bancaria: ' + error.message });
    }
  }
}

export default new BankAccountController();