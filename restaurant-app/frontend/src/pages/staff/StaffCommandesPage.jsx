import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../../components/Shell.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';
import { formatCurrency, formatDateTime, statusLabelMap, statusToneMap } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

export default function StaffCommandesPage() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [error, setError] = useState('');
  const { pushToast } = useToast();

  const loadCommandes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/commandes');
      setCommandes(data.filter((item) => item.statut !== 'payee'));
      setError('');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandes();
  }, []);

  const markAsPaid = async (commande) => {
    try {
      await api.put(`/commandes/${commande.id_commande}/statut`, { statut: 'payee' });
      pushToast({
        tone: 'success',
        title: 'Commande encaissee',
        message: `La table ${commande.table_numero} a ete liberee.`
      });
      loadCommandes();
      setPaying(null);
    } catch (err) {
      pushToast({ tone: 'error', title: 'Action impossible', message: extractApiError(err) });
    }
  };

  const totalLabel = useMemo(() => {
    if (!paying) return '';
    return formatCurrency(paying.total);
  }, [paying]);

  return (
    <Shell
      layout="topbar"
      topbarBrand="RestoAcker"
      topbarTabs={[
        { label: 'COMMANDES', to: '/staff/commandes', active: true },
        { label: 'TABLES', to: '/staff/tables' }
      ]}
      topbarRightVariant="profile"
      hideHeader
    >
      {error ? <EmptyState title="Commandes indisponibles" description={error} /> : null}
      {!error && loading ? (
        <div className="staff-commandes__loading">
          <Skeleton height={520} />
        </div>
      ) : null}
      {!error && !loading && !commandes.length ? (
        <EmptyState title="Aucune commande active" description="Le service est a jour." />
      ) : null}

      {!error && !loading ? (
        <div className="staff-commandes">
          <div className="staff-commandes__header">
            <div className="staff-commandes__header-left">
              <h1 className="staff-commandes__title">Mes commandes en cours</h1>
              <div className="staff-commandes__live">
                <span className="staff-commandes__live-dot" />
                LIVE
              </div>
            </div>
            <div className="staff-commandes__actions">
              <button type="button" className="staff-commandes__action staff-commandes__action--ghost" onClick={loadCommandes}>
                RAFRAICHIR
              </button>
              <button
                type="button"
                className="staff-commandes__action staff-commandes__action--primary"
                onClick={() => navigate('/staff/tables')}
              >
                NOUVELLE COMMANDE
              </button>
            </div>
          </div>

          <div className="staff-commandes__grid">
            {commandes.map((commande) => (
              <div key={commande.id_commande} className="staff-commandes__card">
                <div className="staff-commandes__card-top">
                  <div>
                    <div className="staff-commandes__card-table">TABLE {String(commande.table_numero).padStart(2, '0')}</div>
                    <div className="staff-commandes__card-title">Commande #{commande.id_commande}</div>
                  </div>
                  <div
                    className={`staff-commandes__status staff-commandes__status--${commande.statut}`}
                    title={statusLabelMap[commande.statut]}
                  >
                    {statusLabelMap[commande.statut]}
                  </div>
                </div>

                <div className="staff-commandes__card-body">
                  <div className="staff-commandes__meta">
                    {commande.serveur_nom} • {formatDateTime(commande.created_at)}
                  </div>

                  <div className="staff-commandes__lines">
                    <div className="staff-commandes__line">
                      <span className="staff-commandes__line-left">{commande.nombre_lignes} ligne(s)</span>
                      <span className="staff-commandes__line-right" />
                    </div>
                  </div>

                  <div className="staff-commandes__total">
                    <span className="staff-commandes__total-label">TOTAL</span>
                    <span className="staff-commandes__total-value">{formatCurrency(commande.total)}</span>
                  </div>
                </div>

                <div className="staff-commandes__card-footer">
                  <button
                    type="button"
                    className="staff-commandes__btn staff-commandes__btn--pay"
                    onClick={() => {
                      setPaymentMethod('card');
                      setPaying(commande);
                    }}
                  >
                    PAYER
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(paying)}
        title="CONFIRMATION PAIEMENT"
        onClose={() => setPaying(null)}
        className="staff-payment-modal"
        backdropClassName="staff-payment-backdrop"
        footer={
          <div className="staff-payment__footer">
            <button
              type="button"
              className="staff-payment__confirm"
              onClick={() => (paying ? markAsPaid(paying) : null)}
            >
              CONFIRMER LE PAIEMENT
            </button>
            <button type="button" className="staff-payment__cancel" onClick={() => setPaying(null)}>
              ANNULER
            </button>
          </div>
        }
      >
        {paying ? (
          <div className="staff-payment__body">
            <div className="staff-payment__toprow">
              <div className="staff-payment__meta">Commande #{paying.id_commande}</div>
              <div className="staff-payment__meta">Table {paying.table_numero}</div>
            </div>

            <div className="staff-payment__amount">
              <div className="staff-payment__amount-label">MONTANT TOTAL A REGLER</div>
              <div className="staff-payment__amount-value">{totalLabel}</div>
            </div>

            <div className="staff-payment__methods">
              <button
                type="button"
                className={`staff-payment__method ${paymentMethod === 'cash' ? 'staff-payment__method--active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                ESPÈCES
              </button>
              <button
                type="button"
                className={`staff-payment__method ${paymentMethod === 'card' ? 'staff-payment__method--active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                CARTE
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Shell>
  );
}
