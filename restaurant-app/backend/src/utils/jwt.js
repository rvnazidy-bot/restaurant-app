import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET manquant dans la configuration.');
  }

  return process.env.JWT_SECRET;
};

export const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h'
  });

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());
