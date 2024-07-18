import express from 'express';
import DepartmentController from '../controllers/department.controller.js';

const router = express.Router();

// Rutas para departamentos
router.post('/', DepartmentController.createDepartment);
router.get('/all', DepartmentController.getAllDepartments);
router.get('/', DepartmentController.getDepartmentsWithPagination);
router.get('/search', DepartmentController.searchDepartments);
router.get('/:id', DepartmentController.getDepartmentById);
router.put('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);

export default router;