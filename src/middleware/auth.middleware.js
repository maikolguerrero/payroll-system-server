import jwt from 'jsonwebtoken';

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No se proporcionó token' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token inválido' });
    }
  };
};

export default authMiddleware;