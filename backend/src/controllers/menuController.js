import { createCategory, deleteCategory, getCategories, updateCategory } from '../models/categoryModel.js';
import { createPlat, deletePlat, getPlats, updatePlat, updatePlatDisponibilite } from '../models/platModel.js';

export const listCategories = async (_req, res) => {
  try {
    return res.json(await getCategories());
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer les categories.' });
  }
};

export const postCategory = async (req, res) => {
  try {
    const category = await createCategory(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de creer la categorie.' });
  }
};

export const putCategory = async (req, res) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de modifier la categorie.' });
  }
};

export const removeCategory = async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    return res.json({ message: 'Categorie supprimee.' });
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de supprimer la categorie.' });
  }
};

export const listPlats = async (_req, res) => {
  try {
    return res.json(await getPlats());
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de recuperer les plats.' });
  }
};

export const postPlat = async (req, res) => {
  try {
    const plat = await createPlat(req.body);
    return res.status(201).json(plat);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de creer ce plat.' });
  }
};

export const putPlat = async (req, res) => {
  try {
    const plat = await updatePlat(req.params.id, req.body);
    return res.json(plat);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de modifier ce plat.' });
  }
};

export const patchPlatDisponibilite = async (req, res) => {
  try {
    const plat = await updatePlatDisponibilite(req.params.id, req.body.disponible);
    return res.json(plat);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de changer la disponibilite.' });
  }
};

export const removePlat = async (req, res) => {
  try {
    await deletePlat(req.params.id);
    return res.json({ message: 'Plat supprime.' });
  } catch (error) {
    if (error?.code === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Plat introuvable.' });
    }

    if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.code === 'ER_UPDATE_ROW_IS_REFERENCED_2') {
      return res
        .status(409)
        .json({ message: 'Impossible de supprimer ce plat car il est reference par des commandes (migration base requise pour la suppression avec historique).' });
    }

    if (error?.code === 'ER_BAD_NULL_ERROR') {
      return res
        .status(409)
        .json({ message: 'Suppression bloquee par la base (id_plat non nullable). Appliquez la migration pour activer la suppression avec historique.' });
    }

    return res.status(500).json({ message: 'Impossible de supprimer ce plat.' });
  }
};
