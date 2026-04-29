import {
  createCommande,
  deleteCommandeById,
  deleteLigneFromCommande,
  getCommandeById,
  listCommandes,
  addLigneToCommande,
  updateCommande,
  updateCommandeLigne,
  updateCommandeStatut
} from '../models/commandeModel.js';
import { getPlatById } from '../models/platModel.js';
import { getTableById } from '../models/tableModel.js';

export const getCommandes = async (req, res) => {
  try {
    const commandes = await listCommandes({
      role: req.user.role,
      statut: req.query.statut,
      date: req.query.date,
      table: req.query.table,
      scope: req.query.scope
    });
    return res.json(commandes);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer les commandes.' });
  }
};

export const putCommande = async (req, res) => {
  try {
    const payload = {
      id_table: req.body.id_table
    };

    if (payload.id_table == null || payload.id_table === '') {
      return res.status(400).json({ message: 'id_table requis.' });
    }

    const table = await getTableById(payload.id_table);
    if (!table) {
      return res.status(404).json({ message: 'Table introuvable.' });
    }

    const updated = await updateCommande(req.params.id, { id_table: Number(payload.id_table) });
    if (!updated) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    return res.json(updated);
  } catch (error) {
    if (error?.code === 'TABLE_OCCUPEE') {
      return res.status(409).json({ message: 'Table occupee.' });
    }
    return res.status(500).json({ message: 'Impossible de modifier la commande.' });
  }
};

export const getCommande = async (req, res) => {
  try {
    const commande = await getCommandeById(req.params.id);
    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }
    return res.json(commande);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer le detail.' });
  }
};

export const postCommande = async (req, res) => {
  try {
    const { id_table, lignes } = req.body;
    if (!id_table || !Array.isArray(lignes) || !lignes.length) {
      return res.status(400).json({ message: 'Table et lignes sont requises.' });
    }

    const table = await getTableById(id_table);
    if (!table) {
      return res.status(404).json({ message: 'Table introuvable.' });
    }

    const normalizedLines = [];
    for (const ligne of lignes) {
      const plat = await getPlatById(ligne.id_plat);
      if (!plat) {
        return res.status(404).json({ message: `Plat ${ligne.id_plat} introuvable.` });
      }

      normalizedLines.push({
        id_plat: plat.id_plat,
        quantite: Number(ligne.quantite || 1),
        prix_unitaire: Number(plat.prix),
        notes: ligne.notes || null
      });
    }

    const commande = await createCommande({
      id_table,
      id_serveur: req.user.id,
      lignes: normalizedLines
    });

    return res.status(201).json(commande);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de creer la commande.' });
  }
};

export const putCommandeStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['en_attente', 'en_preparation', 'servie', 'payee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut de commande invalide.' });
    }

    const commande = await updateCommandeStatut(req.params.id, statut);
    return res.json(commande);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de mettre a jour la commande.' });
  }
};

export const postCommandeLigne = async (req, res) => {
  try {
    const plat = await getPlatById(req.body.id_plat);
    if (!plat) {
      return res.status(404).json({ message: 'Plat introuvable.' });
    }

    await addLigneToCommande(req.params.id, {
      id_plat: plat.id_plat,
      quantite: Number(req.body.quantite || 1),
      prix_unitaire: Number(plat.prix),
      notes: req.body.notes || null
    });

    return res.status(201).json(await getCommandeById(req.params.id));
  } catch (error) {
    return res.status(500).json({ message: 'Impossible d ajouter ce plat.' });
  }
};

export const patchCommandeLigne = async (req, res) => {
  try {
    const quantiteRaw = req.body.quantite;
    const notesRaw = req.body.notes;

    if (quantiteRaw == null && notesRaw == null) {
      return res.status(400).json({ message: 'Aucun champ a modifier.' });
    }

    let quantite;
    if (quantiteRaw != null) {
      quantite = Number(quantiteRaw);
      if (!Number.isFinite(quantite) || quantite < 1) {
        return res.status(400).json({ message: 'Quantite invalide.' });
      }
    }

    const updated = await updateCommandeLigne(req.params.id, req.params.lid, {
      quantite,
      notes: notesRaw != null ? notesRaw : undefined
    });

    if (!updated) {
      return res.status(404).json({ message: 'Ligne introuvable.' });
    }

    return res.json(await getCommandeById(req.params.id));
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de modifier cette ligne.' });
  }
};

export const deleteCommandeLigne = async (req, res) => {
  try {
    await deleteLigneFromCommande(req.params.id, req.params.lid);
    return res.json(await getCommandeById(req.params.id));
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de retirer cette ligne.' });
  }
};

export const deleteCommande = async (req, res) => {
  try {
    const deleted = await deleteCommandeById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }
    return res.json({ message: 'Commande supprimee.' });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de supprimer la commande.' });
  }
};
