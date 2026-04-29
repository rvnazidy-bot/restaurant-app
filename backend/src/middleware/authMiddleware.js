import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session invalide ou expiree.' });
  }
};
