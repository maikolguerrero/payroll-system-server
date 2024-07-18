import express from 'express';
import { upload } from '../config/upload.js';
import CompanyController from '../controllers/company.controller.js';

const router = express.Router();

// Rutas para empresas
router.post('/', upload.single('logo'), CompanyController.createCompany);
router.get('/', CompanyController.getAllCompanies);
router.get('/:id', CompanyController.getCompany);
router.put('/:id', upload.single('logo'), CompanyController.updateCompany);
router.delete('/:id', CompanyController.deleteCompany); 

export default router;