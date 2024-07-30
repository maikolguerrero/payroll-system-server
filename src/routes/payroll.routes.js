import express from 'express';
import PayrollController from '../controllers/payroll.controller.js';

const router = express.Router();

// Generar nómina general de empleados
router.post('/generate/general', PayrollController.generateGeneralPayroll);

// Generar nómina de un empleado
router.post('/generate/employee/:employee_id', PayrollController.generateEmployeePayroll);

// Generar nómina por departamentos
router.post('/generate/department/:department_id', PayrollController.generateDepartmentPayroll);

// Generar nómina por cargos
router.post('/generate/position/:position_id', PayrollController.generatePositionPayroll);

// Obtener todas las nóminas ordenadas
router.get('/', PayrollController.getAllPayrolls);

// Obtener nóminas por departamento ordenadas
router.get('/department/:department_id', PayrollController.getPayrollsByDepartment);

// Obtener nóminas por cargo ordenadas
router.get('/position/:position_id', PayrollController.getPayrollsByPosition);

// Obtener nóminas por empleado
router.get('/employee/:employee_id', PayrollController.getPayrollsByEmployee);

// Obtener nóminas por fecha
router.get('/date/:date', PayrollController.getPayrollsByDate);

// Obtener nóminas por rango de fechas
router.get('/date-range/:start_date/:end_date', PayrollController.getPayrollsByDateRange);

// Editar nómina general de empleados
router.put('/edit/general', PayrollController.editGeneralPayroll);

// Editar nómina de un empleado específico
router.put('/edit/employee/:employee_id', PayrollController.editEmployeePayroll);

// Editar nómina por departamentos
router.put('/edit/department/:department_id', PayrollController.editDepartmentPayroll);

// Editar nómina por cargos
router.put('/edit/position/:position_id', PayrollController.editPositionPayroll);

// Editar una sola nómina por id
router.put('/edit/:payroll_id', PayrollController.editSinglePayroll);

// Eliminar nómina general de empleados
router.delete('/delete/general', PayrollController.deleteGeneralPayroll);

// Eliminar nómina de un empleado específico
router.delete('/delete/employee/:employee_id', PayrollController.deleteEmployeePayroll);

// Eliminar nómina por departamentos
router.delete('/delete/department/:department_id', PayrollController.deleteDepartmentPayroll);

// Eliminar nómina por cargos
router.delete('/delete/position/:position_id', PayrollController.deletePositionPayroll);

// Eliminar una sola nómina por id
router.delete('/delete/:payroll_id', PayrollController.deleteSinglePayroll);

export default router;