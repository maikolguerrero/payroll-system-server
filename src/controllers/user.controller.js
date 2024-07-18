import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { deleteFile } from '../config/upload.js';

class UserController {
  // Registro de usuario
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

  // Inicio de sesión
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

  // Obtener todos los usuarios
  async getAllUsers(req, res) {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los usuarios: ' + error.message });
    }
  }

  // Obtener usuario por ID
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el usuario: ' + error.message });
    }
  }

  // Actualizar usuario
  async updateUser(req, res) {
    const { name, username, password, role } = req.body;

    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      if (name) user.name = name;
      if (username) user.username = username;
      if (password) user.password = await bcrypt.hash(password, 12);
      if (role) user.role = role;

      // Manejar la actualización de la foto de perfil
      if (req.file) {
        if(user.profile_image){
          deleteFile(user.profile_image);
        }
          user.profile_image = req.file.filename;
      }

      await user.save();
      res.status(200).json({ message: 'Usuario actualizado exitosamente', user });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el usuario: ' + error.message });
    }
  }

  // Eliminar usuario
  async deleteUser(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      // Eliminar foto de perfil asociado si existe
      if(user.profile_image){
        deleteFile(user.profile_image);
      }

      res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el usuario: ' + error.message });
    }
  }

  // Actualizar perfil propio
  async updateOwnProfile(req, res) {
    const { name, username, password } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      if (name) user.name = name;
      if (username) user.username = username;
      if (password) user.password = await bcrypt.hash(password, 12);

      // Manejar la actualización del logo (foto de perfil)
      if (req.file) {
        if(user.profile_image){
          deleteFile(user.profile_image);
        }
          user.profile_image = req.file.filename;
      }

      await user.save();
      res.status(200).json({ message: 'Perfil actualizado exitosamente', user });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el perfil: ' + error.message });
    }
  }
}

export default new UserController();