import Department from '../models/department.model.js';

class DepartmentController {
  // Crear un nuevo departamento
  async createDepartment(req, res) {
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Verificar si el nombre del departamento ya existe
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return res.status(400).json({ error: 'Ya existe un departamento con ese nombre.' });
      }

      // Crear un nuevo departamento
      const newDepartment = new Department({ name, description, location });
      await newDepartment.save();
      res.status(201).json({ message: 'Departamento creado exitosamente', department: newDepartment });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el departamento: ' + error.message });
    }
  }

  // Obtener todos los departamentos
  async getAllDepartments(req, res) {
    const { sortBy = 'name', order = 'asc' } = req.query;

    try {
      const departments = await Department.find().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
      res.status(200).json(departments);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los departamentos: ' + error.message });
    }
  }

  // Obtener un departamento por ID
  async getDepartmentById(req, res) {
    try {
      const department = await Department.findById(req.params.id);
      if (!department) return res.status(404).json({ message: 'Departamento no encontrado' });
      res.status(200).json(department);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el departamento: ' + error.message });
    }
  }

  // Obtener todos los departamentos con paginación
  async getDepartmentsWithPagination(req, res) {
    const { page = 1, limit = 10, sortBy = 'name', order = 'asc' } = req.query;

    try {
      // Convertir los parámetros a números
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);

      // Validar parámetros de paginación
      if (pageNumber <= 0 || pageSize <= 0) {
        return res.status(400).json({ error: 'Número de página y tamaño de página deben ser mayores a cero.' });
      }

      // Obtener departamentos con paginación
      const departments = await Department.find()
        .skip((pageNumber - 1) * pageSize) // Saltar los documentos anteriores
        .limit(pageSize) // Limitar el número de documentos
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 }); // Ordenar los documentos

      // Contar el total de departamentos para la paginación
      const totalDepartments = await Department.countDocuments();

      res.status(200).json({
        totalDepartments,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalDepartments / pageSize),
        departments
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los departamentos: ' + error.message });
    }
  }

  // Buscar departamentos por nombre, descripción o ubicación
  async searchDepartments(req, res) {
    const { query, sortBy = 'name', order = 'asc' } = req.query;

    try {
      const departments = await Department.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } }
        ]
      }).sort({ [sortBy]: order === 'asc' ? 1 : -1 }); // Ordenar los documentos

      res.status(200).json(departments);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar departamentos: ' + error.message });
    }
  }

  // Actualizar un departamento
  async updateDepartment(req, res) {
    const { name, description, location } = req.body;
    const departmentId = req.params.id;

    try {
      const department = await Department.findById(departmentId);
      if (!department) return res.status(404).json({ message: 'Departamento no encontrado' });

      // Verificar si el departamento con el nuevo nombre ya existe (excluyendo el actual)
      const existingDepartment = await Department.findOne({ name, _id: { $ne: departmentId } });
      if (existingDepartment) {
        return res.status(400).json({ error: 'El nombre del departamento ya está en uso. Por favor, elige otro nombre.' });
      }


      if (name) department.name = name;
      if (description) department.description = description;
      if (location) department.location = location;

      await department.save();
      res.status(200).json({ message: 'Departamento actualizado exitosamente', department });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el departamento: ' + error.message });
    }
  }

  // Eliminar un departamento
  async deleteDepartment(req, res) {
    try {
      const department = await Department.findByIdAndDelete(req.params.id);
      if (!department) return res.status(404).json({ message: 'Departamento no encontrado' });

      res.status(200).json({ message: 'Departamento eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el departamento: ' + error.message });
    }
  }
}

export default new DepartmentController();