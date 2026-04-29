import { useEffect, useMemo, useRef, useState } from 'react';
import Shell from '../../components/Shell.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';
import { formatCurrency } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

const defaultCategory = { nom: '', ordre: 1 };
const defaultDish = {
  id_categorie: '',
  nom: '',
  description: '',
  prix: '',
  image_url: '',
  disponible: true
};

const normalizeCategoryName = (name) => {
  const value = String(name || '').trim();
  if (!value) return value;
  const upper = value.toUpperCase();
  if (upper === 'PLAQUES' || upper === 'PLAQUE') return 'Plat principal';
  return value;
};

export default function AdminMenuPage() {
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categoryModal, setCategoryModal] = useState({ open: false, data: defaultCategory, id: null });
  const [dishModal, setDishModal] = useState({ open: false, data: defaultDish, id: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { pushToast } = useToast();
  const uploadInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesResponse, platsResponse] = await Promise.all([
        api.get('/categories'),
        api.get('/plats')
      ]);
      setCategories(categoriesResponse.data);
      setPlats(platsResponse.data);
      setError('');
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs = useMemo(() => {
    const normalized = Array.isArray(categories) ? categories : [];
    return [
      { id: 'all', label: 'TOUS LES PLATS' },
      ...normalized.map((category) => ({
        id: String(category.id_categorie),
        label: normalizeCategoryName(category.nom).toUpperCase()
      }))
    ];
  }, [categories]);

  const visiblePlats = useMemo(() => {
    const normalized = Array.isArray(plats) ? plats : [];
    if (activeCategory === 'all') return normalized;
    return normalized.filter((plat) => String(plat.id_categorie) === String(activeCategory));
  }, [plats, activeCategory]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    (Array.isArray(categories) ? categories : []).forEach((cat) => {
      map.set(String(cat.id_categorie), normalizeCategoryName(cat.nom));
    });
    return map;
  }, [categories]);

  const submitCategory = async (event) => {
    event.preventDefault();
    try {
      if (categoryModal.id) {
        await api.put(`/categories/${categoryModal.id}`, categoryModal.data);
      } else {
        await api.post('/categories', categoryModal.data);
      }
      setCategoryModal({ open: false, data: defaultCategory, id: null });
      pushToast({ tone: 'success', title: 'Categorie enregistree', message: 'Le menu a ete mis a jour.' });
      loadData();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Erreur', message: extractApiError(err) });
    }
  };

  const submitDish = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...dishModal.data,
        prix: Number(dishModal.data.prix),
        id_categorie: Number(dishModal.data.id_categorie)
      };
      if (dishModal.id) {
        await api.put(`/plats/${dishModal.id}`, payload);
      } else {
        await api.post('/plats', payload);
      }
      setDishModal({ open: false, data: defaultDish, id: null });
      pushToast({ tone: 'success', title: 'Plat enregistre', message: 'Le plat a ete sauvegarde.' });
      loadData();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Erreur', message: extractApiError(err) });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'plat') {
        await api.delete(`/plats/${confirmDelete.id}`);
      } else {
        await api.delete(`/categories/${confirmDelete.id}`);
      }
      pushToast({ tone: 'success', title: 'Suppression reussie', message: `${confirmDelete.label} a ete supprime.` });
      setConfirmDelete(null);
      loadData();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Suppression impossible', message: extractApiError(err) });
    }
  };

  const toggleDisponibilite = async (plat) => {
    try {
      await api.patch(`/plats/${plat.id_plat}/disponibilite`, { disponible: !plat.disponible });
      loadData();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Action impossible', message: extractApiError(err) });
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click?.();
  };

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append('image', file);

      const { data } = await api.post('/uploads', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setDishModal((current) => ({
        ...current,
        data: {
          ...current.data,
          image_url: data?.url || ''
        }
      }));

      pushToast({ tone: 'success', title: 'Image uploadée', message: 'L\'image a été ajoutée au plat.' });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Upload impossible', message: extractApiError(err) });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Shell
      title="Menu"
      subtitle="Administrez les categories, plats, disponibilites et fiches recettes."
      hideHeader
    >
      {error ? <EmptyState title="Menu indisponible" description={error} /> : null}

      {!error && loading ? (
        <div className="grid grid--2">
          <Card><Skeleton height={220} /></Card>
          <Card><Skeleton height={220} /></Card>
        </div>
      ) : null}

      {!error && !loading && !categories.length ? (
        <EmptyState title="Aucune categorie" description="Creez votre premiere categorie pour demarrer." />
      ) : null}

      {!error && !loading ? (
        <div className="menu-page">
          <div className="menu-page__header">
            <div>
              <h2 className="menu-page__title">Gestion du Menu</h2>
              <p className="menu-page__subtitle">Organisez vos categories et vos plats</p>
            </div>
            <div className="menu-page__actions">
              <Button
                className="menu-page__action-btn"
                variant="secondary"
                onClick={() => setCategoryModal({ open: true, data: defaultCategory, id: null })}
              >
                Ajouter une categorie
              </Button>
              <Button
                className="menu-page__action-btn"
                onClick={() => setDishModal({ open: true, data: defaultDish, id: null })}
              >
                Ajouter plat
              </Button>
            </div>
          </div>

          <div className="menu-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                className={`menu-tab ${activeCategory === tab.id ? 'menu-tab--active' : ''}`}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visiblePlats.length ? (
            <div className="menu-grid">
              {visiblePlats.map((plat) => (
                <div key={plat.id_plat} className="menu-dish">
                  <div className="menu-dish__media">
                    {plat.image_url ? (
                      <img className="menu-dish__img" src={plat.image_url} alt={plat.nom} />
                    ) : (
                      <div className="menu-dish__placeholder">IMAGE: {plat.nom?.toUpperCase?.() || 'PLAT'}</div>
                    )}
                  </div>
                  <div className="menu-dish__body">
                    <div className="menu-dish__row">
                      <div className="menu-dish__name">{plat.nom}</div>
                      <div className="menu-dish__price">{formatCurrency(plat.prix)}</div>
                    </div>
                    <div className="menu-dish__tag">
                      {categoryNameById.get(String(plat.id_categorie)) || 'CATEGORIE'}
                    </div>
                    <div className="menu-dish__footer">
                      <div className="menu-dish__availability">
                        <div className="menu-dish__availability-label">Disponible</div>
                        <label className="switch" aria-label="Disponibilite">
                          <input
                            type="checkbox"
                            checked={Boolean(plat.disponible)}
                            onChange={() => toggleDisponibilite(plat)}
                          />
                          <span className="switch__track" />
                        </label>
                      </div>
                      <div className="menu-dish__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Modifier"
                          onClick={() =>
                            setDishModal({
                              open: true,
                              id: plat.id_plat,
                              data: {
                                id_categorie: plat.id_categorie,
                                nom: plat.nom,
                                description: plat.description || '',
                                prix: plat.prix,
                                image_url: plat.image_url || '',
                                disponible: Boolean(plat.disponible)
                              }
                            })
                          }
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75L21 5.75Z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Supprimer"
                          onClick={() => setConfirmDelete({ type: 'plat', id: plat.id_plat, label: plat.nom })}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="menu-empty">
              <div className="menu-empty__box">
                <div className="menu-empty__title">Aucun plat dans cette categorie</div>
                <div className="menu-empty__subtitle">Commencez par ajouter un plat pour garnir cette section</div>
                <Button onClick={() => setDishModal({ open: true, data: defaultDish, id: null })}>+ Ajouter mon plat</Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Modal
        open={categoryModal.open}
        title={categoryModal.id ? 'MODIFIER CATÉGORIE' : 'NOUVELLE CATÉGORIE'}
        onClose={() => setCategoryModal({ open: false, data: defaultCategory, id: null })}
        className="menu-modal--mini"
      >
        <form className="stack" onSubmit={submitCategory}>
          <Input
            label="Nom de la catégorie"
            placeholder="Nom de la catégorie"
            value={categoryModal.data.nom}
            onChange={(event) =>
              setCategoryModal((current) => ({
                ...current,
                data: { ...current.data, nom: event.target.value }
              }))
            }
          />
          <Button className="menu-mini__submit" type="submit">
            {categoryModal.id ? 'ENREGISTRER' : 'CRÉER'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={dishModal.open}
        title={dishModal.id ? 'MODIFIER UN PLAT' : 'AJOUTER UN PLAT'}
        onClose={() => setDishModal({ open: false, data: defaultDish, id: null })}
        variant="sheet"
        className="menu-modal--sheet"
        footer={
          <>
            <Button className="menu-sheet__btn menu-sheet__btn--cancel" variant="secondary" onClick={() => setDishModal({ open: false, data: defaultDish, id: null })}>
              ANNULER
            </Button>
            <Button className="menu-sheet__btn" onClick={submitDish}>
              ENREGISTRER
            </Button>
          </>
        }
      >
        <form className="stack" onSubmit={submitDish}>
          <label className="field">
            <span className="field__label">CATÉGORIE</span>
            <select
              className="select"
              value={dishModal.data.id_categorie}
              onChange={(event) =>
                setDishModal((current) => ({
                  ...current,
                  data: { ...current.data, id_categorie: event.target.value }
                }))
              }
            >
              <option value="">Selectionner</option>
              {categories.map((category) => (
                <option key={category.id_categorie} value={category.id_categorie}>
                  {category.nom}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Nom du plat"
            value={dishModal.data.nom}
            onChange={(event) =>
              setDishModal((current) => ({ ...current, data: { ...current.data, nom: event.target.value } }))
            }
          />
          <label className="field">
            <span className="field__label">DESCRIPTION (OPTIONNEL)</span>
            <textarea
              rows="4"
              value={dishModal.data.description}
              onChange={(event) =>
                setDishModal((current) => ({
                  ...current,
                  data: { ...current.data, description: event.target.value }
                }))
              }
            />
          </label>
          <Input
            label="PRIX (AR)"
            type="number"
            value={dishModal.data.prix}
            onChange={(event) =>
              setDishModal((current) => ({ ...current, data: { ...current.data, prix: event.target.value } }))
            }
          />
          <label className="field">
            <span className="field__label">IMAGE DU PLAT</span>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={handleUploadChange}
            />
            <div className="upload-box" role="button" tabIndex={0} onClick={handleUploadClick} onKeyDown={(e) => (e.key === 'Enter' ? handleUploadClick() : null)}>
              <span className="upload-box__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M19 18H6a4 4 0 0 1-.35-7.98A5 5 0 0 1 15.9 8.6 3.5 3.5 0 0 1 19 12a3 3 0 0 1 0 6Zm-7-3v-4H9l3-3 3 3h-3v4h-2Z"
                  />
                </svg>
              </span>
              <span>Cliquer pour uploader (JPG, PNG)</span>
            </div>
          </label>
          <div className="menu-sheet__availability">
            <span className="menu-sheet__availability-label">Disponible</span>
            <label className="switch" aria-label="Disponible">
              <input
                type="checkbox"
                checked={dishModal.data.disponible}
                onChange={(event) =>
                  setDishModal((current) => ({
                    ...current,
                    data: { ...current.data, disponible: event.target.checked }
                  }))
                }
              />
              <span className="switch__track" />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        title="Confirmation"
        onClose={() => setConfirmDelete(null)}
        className="menu-modal--confirm"
        footer={
          <>
            <Button className="menu-confirm__btn menu-confirm__btn--cancel" variant="secondary" onClick={() => setConfirmDelete(null)}>
              ANNULER
            </Button>
            <Button className="menu-confirm__btn" variant="danger" onClick={handleDelete}>
              (SUPPRIMER)
            </Button>
          </>
        }
      >
        <div className="menu-confirm__body">
          <div className="menu-confirm__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"
              />
            </svg>
          </div>
          <div className="menu-confirm__text">
            Voulez-vous vraiment (SUPPRIMER) ce plat ? Cette action est irréversible.
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
