import express from 'express';
import EmployeeController from '../controllers/employee.controller.js';

const router = express.Router();

// Rutas para empleados
router.post('/', EmployeeController.createEmployee);
router.get('/all', EmployeeController.getAllEmployees);
router.get('/', EmployeeController.getEmployeesWithPagination);
router.get('/search', EmployeeController.searchEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.put('/:id', EmployeeController.updateEmployee);
router.get('/department/:id', EmployeeController.getEmployeesByDepartment);
router.get('/position/:id', EmployeeController.getEmployeesByPosition);
router.delete('/:id', EmployeeController.deleteEmployee);

export default router;