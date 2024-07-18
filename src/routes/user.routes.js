import express from 'express';
import UserController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// Rutas para registrar usuarios
router.post('/register', UserController.registerUser);

// Ruta para iniciar sesión
router.post('/login', UserController.loginUser);

// Ruta para actualizar el perfil propio
router.put('/profile', authMiddleware(), upload.single('profile_image'), UserController.updateOwnProfile);

// Rutas protegidas:
router.get('/', authMiddleware(['admin_principal']), UserController.getAllUsers);
router.get('/:id', authMiddleware(['admin_principal']), UserController.getUserById);
router.put('/:id', authMiddleware(['admin_principal']), upload.single('profile_image'), UserController.updateUser);
router.delete('/:id', authMiddleware(['admin_principal']), UserController.deleteUser);

export default router;