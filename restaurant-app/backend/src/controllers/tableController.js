import {
  createTable as createTableModel,
  deleteTableById,
  getActiveCommandeForTable,
  getTableById,
  getTables,
  updateTable as updateTableModel,
  updateTableStatus
} from '../models/tableModel.js';

export const listTables = async (_req, res) => {
  try {
    const tables = await getTables();
    return res.json(tables);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer les tables.' });
  }
};

export const createTable = async (req, res) => {
  try {
    const { numero, capacite, statut } = req.body;
    if (numero == null || capacite == null) {
      return res.status(400).json({ message: 'Numero et capacite requis.' });
    }

    if (!['libre', 'occupee', 'reservee'].includes(statut || 'libre')) {
      return res.status(400).json({ message: 'Statut de table invalide.' });
    }

    const created = await createTableModel({
      numero: Number(numero),
      capacite: Number(capacite),
      statut: statut || 'libre'
    });

    return res.status(201).json(created);
  } catch (error) {
    if (String(error.message || '').includes('Duplicate')) {
      return res.status(409).json({ message: 'Numero de table deja utilise.' });
    }
    return res.status(500).json({ message: 'Impossible de creer cette table.' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const existing = await getTableById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Table introuvable.' });
    }

    const { numero, capacite, statut } = req.body;
    if (statut != null && !['libre', 'occupee', 'reservee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut de table invalide.' });
    }

    const updated = await updateTableModel(req.params.id, {
      numero: numero != null ? Number(numero) : undefined,
      capacite: capacite != null ? Number(capacite) : undefined,
      statut: statut != null ? statut : undefined
    });

    return res.json(updated);
  } catch (error) {
    if (String(error.message || '').includes('Duplicate')) {
      return res.status(409).json({ message: 'Numero de table deja utilise.' });
    }
    return res.status(500).json({ message: 'Impossible de modifier cette table.' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const existing = await getTableById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Table introuvable.' });
    }

    const active = await getActiveCommandeForTable(req.params.id);
    if (active) {
      return res.status(409).json({ message: 'Impossible de supprimer une table avec une commande active.' });
    }

    const deleted = await deleteTableById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Table introuvable.' });
    }

    return res.json({ message: 'Table supprimee.' });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de supprimer cette table.' });
  }
};

export const setTableStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['libre', 'occupee', 'reservee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut de table invalide.' });
    }

    const table = await updateTableStatus(req.params.id, statut);
    return res.json(table);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de modifier cette table.' });
  }
};
