import express from 'express';
import UserController from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas para usuarios
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// Ejemplo de ruta protegida
router.get('/protected-route', authMiddleware(['admin_principal']), (req, res) => {
  res.status(200).json({ message: 'Esta es una ruta protegida' });
});

export default router;
