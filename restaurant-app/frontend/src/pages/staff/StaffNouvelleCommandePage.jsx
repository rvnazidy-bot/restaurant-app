import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell from '../../components/Shell.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import Modal from '../../components/Modal.jsx';
import api, { extractApiError } from '../../services/api';
import { formatCurrency } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

export default function StaffNouvelleCommandePage() {
  const { id_table } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [notes, setNotes] = useState({});
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, platsResponse] = await Promise.all([
          api.get('/categories'),
          api.get('/plats')
        ]);
        setCategories(categoriesResponse.data);
        setPlats(platsResponse.data.filter((item) => item.disponible));
        if (categoriesResponse.data.length) setActiveCat(categoriesResponse.data[0].id_categorie);
        setError('');
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const grouped = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        plats: plats.filter((plat) => plat.id_categorie === category.id_categorie)
      })),
    [categories, plats]
  );

  const cartItems = useMemo(
    () =>
      plats
        .filter((plat) => cart[plat.id_plat])
        .map((plat) => ({
          ...plat,
          quantite: cart[plat.id_plat],
          notes: notes[plat.id_plat] || ''
        })),
    [plats, cart, notes]
  );

  const total = cartItems.reduce((sum, item) => sum + Number(item.prix) * item.quantite, 0);

  const adjustQuantity = (platId, delta) => {
    setCart((current) => {
      const next = (current[platId] || 0) + delta;
      if (next <= 0) {
        const clone = { ...current };
        delete clone[platId];
        return clone;
      }
      return { ...current, [platId]: next };
    });
  };

  const submitCommande = async () => {
    if (!cartItems.length) {
      pushToast({ tone: 'error', title: 'Panier vide', message: 'Ajoutez au moins un plat.' });
      return;
    }
    setConfirmModal(true);
  };

  const confirmSend = async () => {
    try {
      await api.post('/commandes', {
        id_table: Number(id_table),
        lignes: cartItems.map((item) => ({
          id_plat: item.id_plat,
          quantite: item.quantite,
          notes: item.notes
        }))
      });
      pushToast({ tone: 'success', title: 'Commande envoyee', message: 'La cuisine a recu la commande.' });
      navigate('/staff/commandes');
    } catch (err) {
      pushToast({ tone: 'error', title: 'Envoi impossible', message: extractApiError(err) });
    }
  };

  return (
    <Shell
      layout="topbar"
      topbarBrand="RestoAcker"
      topbarActiveTab="MENU PERSONNEL"
      topbarTitle=""
      topbarRightVariant="profile"
      hideHeader
    >
      {error ? <EmptyState title="Menu indisponible" description={error} /> : null}
      {!error && loading ? (
        <div className="staff-nouvelle__loading">
          <Skeleton height={520} />
        </div>
      ) : null}
      {!error && !loading ? (
        <div className="staff-nouvelle">
          <div className="staff-nouvelle__header">
            <div className="staff-nouvelle__title">Commande #043 - Table {id_table}</div>
            <div className="staff-nouvelle__status">EN ATTENTE</div>
            <div className="staff-nouvelle__actions">
              <Button className="staff-nouvelle__btn staff-nouvelle__btn--ghost" onClick={() => navigate(-1)}>
                Annuler
              </Button>
              <Button className="staff-nouvelle__btn staff-nouvelle__btn--danger" onClick={submitCommande}>
                Envoyer en cuisine
              </Button>
            </div>
          </div>

          <div className="staff-nouvelle__layout">
            <div className="staff-nouvelle__left">
              <div className="staff-nouvelle__tabs">
                {categories.map((cat) => (
                  <button
                    key={cat.id_categorie}
                    className={`staff-nouvelle__tab ${
                      activeCat === cat.id_categorie ? 'staff-nouvelle__tab--active' : ''
                    }`}
                    onClick={() => setActiveCat(cat.id_categorie)}
                  >
                    {cat.nom.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="staff-nouvelle__menu-grid">
                {plats
                  .filter((plat) => plat.id_categorie === activeCat)
                  .map((plat) => (
                    <div key={plat.id_plat} className="staff-nouvelle__dish-card">
                      <img
                        className="staff-nouvelle__dish-img"
                        src={
                          plat.image_url ||
                          `https://via.placeholder.com/76x54/eee/999?text=${encodeURIComponent(
                            plat.nom
                          )}`
                        }
                        alt={plat.nom}
                      />
                      <div className="staff-nouvelle__dish-body">
                        <div className="staff-nouvelle__dish-name">{plat.nom}</div>
                        <div className="staff-nouvelle__dish-price">{formatCurrency(plat.prix)}</div>
                      </div>
                      <button
                        className="staff-nouvelle__dish-add"
                        onClick={() => adjustQuantity(plat.id_plat, 1)}
                      >
                        +
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="staff-nouvelle__right">
              <div className="staff-nouvelle__recap">
                <div className="staff-nouvelle__recap-title">Récapitulatif</div>
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <div key={item.id_plat} className="staff-nouvelle__recap-item">
                      <div className="staff-nouvelle__recap-left">
                        <div className="staff-nouvelle__recap-name">{item.nom}</div>
                        <div className="staff-nouvelle__recap-sub">{formatCurrency(item.prix)} / unité</div>
                      </div>
                      <div className="staff-nouvelle__recap-qty">
                        <button
                          className="staff-nouvelle__recap-qty-btn"
                          onClick={() => adjustQuantity(item.id_plat, -1)}
                        >
                          -
                        </button>
                        <span className="staff-nouvelle__recap-qty-val">{item.quantite}</span>
                        <button
                          className="staff-nouvelle__recap-qty-btn"
                          onClick={() => adjustQuantity(item.id_plat, 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="staff-nouvelle__recap-price">
                        {formatCurrency(item.prix * item.quantite)}
                      </div>
                      <button
                        className="staff-nouvelle__recap-remove"
                        onClick={() => adjustQuantity(item.id_plat, -item.quantite)}
                        aria-label={`Supprimer ${item.nom}`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Panier vide" description="Ajoutez des plats depuis le menu." />
                )}
                <div className="staff-nouvelle__recap-total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={confirmModal}
        title="Confirmer l'envoi"
        onClose={() => setConfirmModal(false)}
        className="staff-nouvelle-confirm-modal"
        backdropClassName="staff-nouvelle-confirm-backdrop"
        footer={
          <div className="staff-nouvelle-confirm-footer">
            <Button className="staff-nouvelle-confirm-cancel" onClick={() => setConfirmModal(false)}>
              Modifier
            </Button>
            <Button className="staff-nouvelle-confirm-send" onClick={confirmSend}>
              Envoyer
            </Button>
          </div>
        }
      >
        <div className="staff-nouvelle-confirm-body">
          <div className="staff-nouvelle-confirm-text">
            Voulez-vous envoyer les articles suivants en cuisine ?
          </div>
          <div className="staff-nouvelle-confirm-box">
            {cartItems.map((item) => (
              <div key={item.id_plat} className="staff-nouvelle-confirm-row">
                <div className="staff-nouvelle-confirm-row-left">
                  {item.quantite}x {item.nom}
                </div>
                <div className="staff-nouvelle-confirm-row-right">
                  {formatCurrency(item.prix * item.quantite)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
