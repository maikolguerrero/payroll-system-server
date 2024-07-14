import express from 'express';
import UserController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas para usuarios
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Ruta para actualizar el perfil propio
router.put('/profile', authMiddleware(), UserController.updateOwnProfile);

// Rutas protegidas:
router.get('/', authMiddleware(['admin_principal']), UserController.getAllUsers);
router.get('/:id', authMiddleware(['admin_principal']), UserController.getUserById);
router.put('/:id', authMiddleware(['admin_principal']), UserController.updateUser);
router.delete('/:id', authMiddleware(['admin_principal']), UserController.deleteUser);

export default router;