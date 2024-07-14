import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserController {
  async registerUser(req, res) {
    const { name, username, password, role = 'admin_nomina' } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({ name, username, password: hashedPassword, role });

      await newUser.save();
      res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el usuario: ' + error.message });
    }
  }

  async loginUser(req, res) {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });

      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) return res.status(400).json({ message: 'Credenciales inválidas' });

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({ result: user, token });
    } catch (error) {
      res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
    }
  }
}

export default new UserController();