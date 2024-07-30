import express from 'express';
import BankController from '../controllers/bank.controller.js';

const router = express.Router();

// Rutas para bancos
router.post('/', BankController.createBank);
router.get('/all', BankController.getAllBanks);
router.get('/', BankController.getBanksWithPagination);
router.get('/search', BankController.searchBanks);
router.get('/:id', BankController.getBankById);
router.put('/:id', BankController.updateBank);
router.delete('/:id', BankController.deleteBank);

export default router;