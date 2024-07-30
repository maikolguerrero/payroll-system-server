import express from 'express';
import DeductionController from '../controllers/deduction.controller.js';

const router = express.Router();

// Rutas para deducciones
router.post('/', DeductionController.createDeduction);
router.get('/all', DeductionController.getAllDeductions);
router.get('/', DeductionController.getDeductionsWithPagination);
router.get('/search', DeductionController.searchDeductions);
router.get('/:id', DeductionController.getDeductionById);
router.put('/:id', DeductionController.updateDeduction);
router.delete('/:id', DeductionController.deleteDeduction);

export default router;