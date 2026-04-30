import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../../components/Shell.jsx';
import Card from '../../components/Card.jsx';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import api, { extractApiError } from '../../services/api';
import { formatCurrency, formatDateTime, formatTime, statusLabelMap, statusToneMap } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');
  const [recentTab, setRecentTab] = useState('toutes');
  const [openActionFor, setOpenActionFor] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const subtitleDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
    .format(new Date())
    .replace(/^./, (letter) => letter.toUpperCase());

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
        setError('');
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      setRecentLoading(true);
      setRecentError('');
      try {
        const { data } = await api.get('/commandes', { params: { scope: 'history' } });
        const normalized = Array.isArray(data) ? data : [];
        setRecentOrders(normalized.slice(0, 18));
      } catch (err) {
        setRecentError(extractApiError(err));
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecent();
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest('.action-menu') && !event.target.closest('.table-action')) {
        setOpenActionFor(null);
      }
    };

    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, []);

  const visibleOrders = (() => {
    const normalized = Array.isArray(recentOrders) ? recentOrders : [];
    const filtered =
      recentTab === 'actives'
        ? normalized.filter((item) => ['en_attente', 'en_preparation', 'servie'].includes(item.statut))
        : recentTab === 'payees'
          ? normalized.filter((item) => item.statut === 'payee')
          : normalized;
    return filtered.slice(0, 8);
  })();

  const viewDetail = async (commandeId) => {
    setSelectedId(commandeId);
    setSelectedCommande(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/commandes/${commandeId}`);
      setSelectedCommande(data);
    } catch (err) {
      setDetailError(extractApiError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const markAsPaid = async (commande) => {
    try {
      await api.put(`/commandes/${commande.id_commande}/statut`, { statut: 'payee' });
      pushToast({
        tone: 'success',
        title: 'Commande encaissee',
        message: `Commande #${commande.id_commande} marque payee.`
      });
      setOpenActionFor(null);

      setRecentLoading(true);
      const { data } = await api.get('/commandes', { params: { scope: 'history' } });
      setRecentOrders((Array.isArray(data) ? data : []).slice(0, 18));
    } catch (err) {
      pushToast({ tone: 'error', title: 'Action impossible', message: extractApiError(err) });
    } finally {
      setRecentLoading(false);
    }
  };

  return (
    <Shell
      title="Tableau de bord"
      subtitle={subtitleDate}
    >
      {loading ? (
        <div className="grid grid--3">
          <Card><Skeleton height={120} /></Card>
          <Card><Skeleton height={120} /></Card>
          <Card><Skeleton height={120} /></Card>
        </div>
      ) : null}

      {!loading && error ? (
        <EmptyState title="Dashboard indisponible" description={error} />
      ) : null}

      {!loading && stats ? (
        <>
          <div className="grid grid--3">
            <StatCard
              label="CA DU JOUR"
              value={formatCurrency(stats.chiffreAffaires.jour)}
              delta="+12%"
            />
            <StatCard
              label="CA SEMAINE"
              value={formatCurrency(stats.chiffreAffaires.semaine)}
              delta="+8%"
            />
            <StatCard
              label="CA MOIS"
              value={formatCurrency(stats.chiffreAffaires.mois)}
              delta="+15%"
            />
          </div>

          <div className="grid grid--2">
            <Card className="list-card">
              <div className="row">
                <h3>Etat des commandes</h3>
                <Badge tone="info">Temps reel</Badge>
              </div>
              <div className="progress-list">
                {(() => {
                  const rows = Array.isArray(stats.commandesParStatut) ? stats.commandesParStatut : [];
                  const filtered = rows.filter((item) =>
                    ['en_attente', 'en_preparation', 'servie', 'payee'].includes(item.statut)
                  );
                  const max = Math.max(1, ...filtered.map((item) => Number(item.total || 0)));
                  return filtered.map((item) => (
                    <div key={item.statut} className="progress-row">
                      <div className="progress-row__head">
                        <span className="progress-row__label">{statusLabelMap[item.statut]}</span>
                        <span className="progress-row__value">{item.total}</span>
                      </div>
                      <div className="progress">
                        <div
                          className={`progress__bar progress__bar--${item.statut}`}
                          style={{ width: `${Math.round((Number(item.total || 0) / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Card>

            <Card className="list-card">
              <div className="row">
                <h3>Top plats</h3>
                <Badge tone="dark">5 commandes supplementaires</Badge>
              </div>
              <div className="rank-list">
                {stats.topPlats.map((plat, index) => (
                  <div key={plat.id_plat} className="rank-item">
                    <div className={`rank-item__num ${index < 3 ? 'rank-item__num--hot' : ''}`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="rank-item__name">{plat.nom}</div>
                    <div className="rank-item__value">{plat.quantite_totale}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="table-card">
            <div className="table-toolbar table-toolbar--tabs">
              <div>
                <h3>Commandes recentes</h3>
              </div>
              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${recentTab === 'toutes' ? 'tab--active' : ''}`}
                  onClick={() => setRecentTab('toutes')}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  className={`tab ${recentTab === 'actives' ? 'tab--active' : ''}`}
                  onClick={() => setRecentTab('actives')}
                >
                  Actives
                </button>
                <button
                  type="button"
                  className={`tab ${recentTab === 'payees' ? 'tab--active' : ''}`}
                  onClick={() => setRecentTab('payees')}
                >
                  Payees
                </button>
              </div>
            </div>

            {recentError ? <EmptyState title="Commandes indisponibles" description={recentError} /> : null}

            {!recentError && recentLoading ? <Skeleton height={240} /> : null}

            {!recentError && !recentLoading ? (
              <table className="table table--clean">
                <thead>
                  <tr>
                    <th># ID</th>
                    <th>Table</th>
                    <th>Statut</th>
                    <th>Montant</th>
                    <th>Heure</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((commande) => (
                    <tr key={commande.id_commande}>
                      <td>#{commande.id_commande}</td>
                      <td>Table {String(commande.table_numero).padStart(2, '0')}</td>
                      <td>
                        <Badge tone={statusToneMap[commande.statut] || 'neutral'}>
                          {statusLabelMap[commande.statut] || commande.statut}
                        </Badge>
                      </td>
                      <td>{formatCurrency(commande.total)}</td>
                      <td>{formatTime(commande.updated_at || commande.created_at)}</td>
                      <td>
                        <div className="action-cell">
                          <button
                            type="button"
                            className="table-action"
                            aria-label="Actions"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenActionFor((current) =>
                                current === commande.id_commande ? null : commande.id_commande
                              );
                            }}
                          >
                            ...
                          </button>
                          {openActionFor === commande.id_commande ? (
                            <div className="action-menu" role="menu">
                              <button
                                type="button"
                                className="action-menu__item"
                                role="menuitem"
                                onClick={() => {
                                  setOpenActionFor(null);
                                  viewDetail(commande.id_commande);
                                }}
                              >
                                Voir detail
                              </button>
                              {commande.statut !== 'payee' ? (
                                <button
                                  type="button"
                                  className="action-menu__item"
                                  role="menuitem"
                                  onClick={() => markAsPaid(commande)}
                                >
                                  Marquer payee
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            <button
              type="button"
              className="table-footer-link"
              onClick={() => navigate('/admin/historique')}
            >
              VOIR TOUTES LES COMMANDES
            </button>
          </Card>

          <Modal
            open={Boolean(selectedId)}
            title={selectedCommande ? `Detail commande #${selectedCommande.id_commande}` : 'Detail commande'}
            variant="sheet"
            onClose={() => {
              setSelectedId(null);
              setSelectedCommande(null);
              setDetailError('');
              setDetailLoading(false);
            }}
            className="menu-modal--sheet"
            footer={
              selectedCommande ? (
                <>
                  <Button className="menu-sheet__btn menu-sheet__btn--cancel" variant="secondary" onClick={() => setSelectedId(null)}>
                    FERMER
                  </Button>
                  {selectedCommande.statut !== 'payee' ? (
                    <Button className="menu-sheet__btn" onClick={() => markAsPaid(selectedCommande)}>
                      MARQUER PAYEE
                    </Button>
                  ) : null}
                </>
              ) : null
            }
          >
            {detailError ? <EmptyState title="Detail indisponible" description={detailError} /> : null}
            {!detailError && detailLoading ? <Skeleton height={240} /> : null}
            {!detailError && !detailLoading && selectedCommande ? (
              <div className="stack">
                <div className="key-value">
                  <div className="key-value__row"><span>Table</span><strong>{selectedCommande.table_numero}</strong></div>
                  <div className="key-value__row"><span>Serveur</span><strong>{selectedCommande.serveur_nom}</strong></div>
                  <div className="key-value__row"><span>Statut</span><Badge tone={statusToneMap[selectedCommande.statut]}>{statusLabelMap[selectedCommande.statut]}</Badge></div>
                  <div className="key-value__row"><span>Heure</span><strong>{formatDateTime(selectedCommande.created_at)}</strong></div>
                </div>
                <div className="divider" />
                <div className="order-lines">
                  {selectedCommande.lignes.map((ligne) => (
                    <div key={ligne.id_ligne} className="order-line">
                      <div>
                        <strong>{ligne.plat_nom}</strong>
                        <div className="muted">{ligne.notes || 'Aucune note'}</div>
                      </div>
                      <div>
                        {ligne.quantite} x {formatCurrency(ligne.prix_unitaire)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>Total</span>
                  <span>{formatCurrency(selectedCommande.total)}</span>
                </div>
              </div>
            ) : null}
          </Modal>
        </>
      ) : null}
    </Shell>
  );
}
