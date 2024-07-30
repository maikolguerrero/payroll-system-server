import Employee from '../models/employee.model.js';
import Department from '../models/department.model.js';
import Position from '../models/position.model.js';
import mongoose from 'mongoose';

class EmployeeController {
  // Crear un nuevo empleado
  async createEmployee(req, res) {
    const { ci, name, surnames, address, phone, email, birthdate, base_salary, hire_date, department_id, position_id, gender } = req.body;

    if (!ci || !name || !surnames || !email || !base_salary || !hire_date || !department_id || !position_id) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben estar presentes.' });
    }

    try {
      // Verificar si la cédula ya existe
      const existingCi = await Employee.findOne({ ci });
      if (existingCi) {
        return res.status(400).json({ error: 'Ya existe un empleado con esa cédula.' });
      }

      // Verificar si el email ya existe
      const existingEmail = await Employee.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese email.' });
      }

      // Verificar si el departamento existe
      const departmentExists = await Department.findById(department_id);
      if (!departmentExists) {
        return res.status(400).json({ error: 'El departamento especificado no existe.' });
      }

      // Verificar si el puesto existe
      const positionExists = await Position.findById(position_id);
      if (!positionExists) {
        return res.status(400).json({ error: 'El puesto especificado no existe.' });
      }

      if (gender !== 'Masculino' && gender !== 'Femenino') {
        return res.status(400).json({ error: 'El género debe ser "Masculino" o "Femenino".' });
      }

      // Crear un nuevo empleado
      const newEmployee = new Employee({
        ci,
        name,
        surnames,
        address,
        phone,
        email,
        birthdate,
        base_salary,
        hire_date,
        department_id,
        position_id,
        gender
      });
      await newEmployee.save();
      res.status(201).json({ message: 'Empleado creado exitosamente', employee: newEmployee });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el empleado: ' + error.message });
    }
  }

  // Obtener todos los empleados
  async getAllEmployees(req, res) {
    const { sortBy = 'name', order = 'asc' } = req.query;

    try {
      const employees = await Employee.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los empleados: ' + error.message });
    }
  }

  // Obtener un empleado por ID
  async getEmployeeById(req, res) {
    try {

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'ID de empleado inválido.' });
      }

      const employee = await Employee.findById(req.params.id);

      if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });
      res.status(200).json(employee);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el empleado: ' + error.message });
    }
  }

  // Obtener todos los empleados con paginación
  async getEmployeesWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      const employees = await Employee.find()
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      const totalEmployees = await Employee.countDocuments();

      res.status(200).json({
        totalEmployees,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalEmployees / pageSize),
        employees
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los empleados: ' + error.message });
    }
  }

  // Buscar empleados por todos los campos
  async searchEmployees(req, res) {
    const { query, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const employees = await Employee.find({
        $or: [
          { ci: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
          { surnames: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } }
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 });

      res.status(200).json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar los empleados: ' + error.message });
    }
  }

  // Obtener empleados por departamento
  async getEmployeesByDepartment(req, res) {
    try {
      const { id } = req.params;
      const employees = await Employee.find({ department_id: id });

      if (!employees.length) {
        return res.status(404).json({ message: 'No se encontraron empleados para este departamento' });
      }

      res.status(200).json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener empleados por departamento: ' + error.message });
    }
  }

  // Obtener empleados por cargo
  async getEmployeesByPosition(req, res) {
    try {
      const { id } = req.params;
      const employees = await Employee.find({ position_id: id });

      if (!employees.length) {
        return res.status(404).json({ message: 'No se encontraron empleados para este cargo' });
      }

      res.status(200).json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener empleados por cargo: ' + error.message });
    }
  }

  // Actualizar un empleado
  async updateEmployee(req, res) {
    const { ci, name, surnames, address, phone, email, birthdate, base_salary, hire_date, department_id, position_id, gender } = req.body;
    const employeeId = req.params.id;

    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

      // Verificar si el departamento existe
      if (department_id) {
        const departmentExists = await Department.findById(department_id);
        if (!departmentExists) {
          return res.status(400).json({ error: 'El departamento especificado no existe.' });
        }
      }

      // Verificar si el puesto existe
      if (position_id) {
        const positionExists = await Position.findById(position_id);
        if (!positionExists) {
          return res.status(400).json({ error: 'El puesto especificado no existe.' });
        }
      }

      // Verificar si la cédula o el email con el nuevo valor ya existen (excluyendo el actual)
      const existingCi = await Employee.findOne({ ci, _id: { $ne: employeeId } });
      if (existingCi) {
        return res.status(400).json({ error: 'Ya existe un empleado con esa cédula.' });
      }

      const existingEmail = await Employee.findOne({ email, _id: { $ne: employeeId } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese email.' });
      }

      // Actualizar los campos del empleado
      if (ci) employee.ci = ci;
      if (name) employee.name = name;
      if (surnames) employee.surnames = surnames;
      if (address) employee.address = address;
      if (phone) employee.phone = phone;
      if (email) employee.email = email;
      if (birthdate) employee.birthdate = birthdate;
      if (base_salary) employee.base_salary = base_salary;
      if (hire_date) employee.hire_date = hire_date;
      if (department_id) employee.department_id = department_id;
      if (position_id) employee.position_id = position_id;
      if (gender) employee.gender = gender;

      await employee.save();
      res.status(200).json({ message: 'Empleado actualizado exitosamente', employee });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el empleado: ' + error.message });
    }
  }

  // Eliminar un empleado
  async deleteEmployee(req, res) {
    try {
      const employee = await Employee.findByIdAndDelete(req.params.id);
      if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

      res.status(200).json({ message: 'Empleado eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el empleado: ' + error.message });
    }
  }
}

export default new EmployeeController();