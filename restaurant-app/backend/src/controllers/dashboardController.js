import { getDashboardStats } from '../models/dashboardModel.js';

export const stats = async (_req, res) => {
  try {
    return res.json(await getDashboardStats());
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer les statistiques.' });
  }
};
