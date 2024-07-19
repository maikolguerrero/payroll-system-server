import express from 'express';
import BankAccountController from '../controllers/bank.account.controller.js';

const router = express.Router();

// Rutas para cuentas bancarias
router.post('/', BankAccountController.createBankAccount);
router.get('/all', BankAccountController.getAllBankAccounts);
router.get('/', BankAccountController.getBankAccountsWithPagination);
router.get('/search', BankAccountController.searchBankAccounts);
router.get('/:id', BankAccountController.getBankAccountById);
router.put('/:id', BankAccountController.updateBankAccount);
router.delete('/:id', BankAccountController.deleteBankAccount);

export default router;