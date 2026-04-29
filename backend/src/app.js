import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import commandeRoutes from './routes/commandeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const normalizeOrigin = (value) => {
  if (!value) return null;
  return String(value).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\/+$/, '');
};

const allowedOrigins = [
  normalizeOrigin(process.env.FRONTEND_URL),
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error(`CORS bloque pour origin: ${origin}`));
  }
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes API
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api', menuRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir le build React en production
const frontendDist = join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Toutes les routes non-API → React (pour React Router)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Route introuvable.' });
  }
  res.sendFile(join(frontendDist, 'index.html'));
});

export default app;
