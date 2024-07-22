import express from 'express';
import payrollExportController from '../controllers/txt.controller.js';

const router = express.Router();

router.post('/', payrollExportController.generatePayrollTXT);

export default router;