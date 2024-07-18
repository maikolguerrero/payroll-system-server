import express from 'express';
import CompanyController from '../controllers/company.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// Rutas para empresas
router.post('/', authMiddleware(['admin_principal']), upload.single('logo'), CompanyController.createCompany);
router.get('/', CompanyController.getAllCompanies);
router.get('/:id', CompanyController.getCompany);
router.put('/:id', authMiddleware(['admin_principal']), upload.single('logo'), CompanyController.updateCompany);
router.delete('/:id', authMiddleware(['admin_principal']), CompanyController.deleteCompany); 

export default router;