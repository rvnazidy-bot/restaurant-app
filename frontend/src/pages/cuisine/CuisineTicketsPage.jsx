import { useEffect, useMemo, useState } from 'react';
import Shell from '../../components/Shell.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';
import { formatDateTime, statusLabelMap } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

export default function CuisineTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { pushToast } = useToast();

  const formatTimeHHMM = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/commandes');
      setTickets(data);
      setError('');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateStatut = async (ticket, statut) => {
    try {
      await api.put(`/commandes/${ticket.id_commande}/statut`, { statut });
      pushToast({
        tone: 'success',
        title: 'Ticket mis a jour',
        message: `Commande #${ticket.id_commande} -> ${statusLabelMap[statut]}`
      });
      loadTickets();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Action impossible', message: extractApiError(err) });
    }
  };

  const activeTickets = useMemo(
    () => tickets.filter((item) => item.statut === 'en_attente' || item.statut === 'en_preparation'),
    [tickets]
  );

  const completedTickets = useMemo(() => tickets.filter((item) => item.statut === 'servie'), [tickets]);

  const filteredTickets = useMemo(() => {
    if (filter === 'en_attente') return activeTickets.filter((t) => t.statut === 'en_attente');
    if (filter === 'en_preparation') return activeTickets.filter((t) => t.statut === 'en_preparation');
    return activeTickets;
  }, [activeTickets, filter]);

  const avgMinutes = useMemo(() => {
    if (!activeTickets.length) return 0;
    const now = Date.now();
    const minutes = activeTickets
      .map((t) => {
        const created = new Date(t.created_at).getTime();
        return Math.max(0, (now - created) / 60000);
      })
      .reduce((a, b) => a + b, 0);
    return Math.round(minutes / activeTickets.length);
  }, [activeTickets]);

  const kitchenCapacity = useMemo(() => {
    if (!activeTickets.length) return 0;
    return Math.min(100, Math.round(activeTickets.length * 25));
  }, [activeTickets]);

  const getChip = (ticket) => {
    if (ticket.statut === 'en_preparation') return { label: 'EN PRÉPARATION', tone: 'orange' };
    const created = new Date(ticket.created_at).getTime();
    const minutes = Math.max(0, (Date.now() - created) / 60000);
    if (minutes >= 15) return { label: 'URGENT', tone: 'red' };
    return { label: 'RÉCENT', tone: 'green' };
  };

  return (
    <Shell
      layout="topbar"
      topbarBrand="RESTOACKER"
      topbarActiveTab="VUE CUISINE"
      hideHeader
    >
      {error ? <EmptyState title="Tickets indisponibles" description={error} /> : null}
      {!error && loading ? (
        <div className="cuisine-tickets__loading">
          <Skeleton height={520} />
        </div>
      ) : null}

      {!error && !loading ? (
        <div className="cuisine-tickets">
          <div className="cuisine-tickets__top">
            <div className="cuisine-tickets__live">
              <span className="cuisine-tickets__live-dot" />
              LIVE
            </div>
            <div className="cuisine-tickets__header">
              <h1 className="cuisine-tickets__title">Tickets en cuisine</h1>
              <div className="cuisine-tickets__filters">
                <button
                  type="button"
                  className={`cuisine-tickets__filter ${filter === 'tous' ? 'cuisine-tickets__filter--active' : ''}`}
                  onClick={() => setFilter('tous')}
                >
                  Tous
                </button>
                <button
                  type="button"
                  className={`cuisine-tickets__filter ${filter === 'en_attente' ? 'cuisine-tickets__filter--active' : ''}`}
                  onClick={() => setFilter('en_attente')}
                >
                  En attente
                </button>
                <button
                  type="button"
                  className={`cuisine-tickets__filter ${filter === 'en_preparation' ? 'cuisine-tickets__filter--active' : ''}`}
                  onClick={() => setFilter('en_preparation')}
                >
                  En préparation
                </button>
              </div>
            </div>
          </div>

          <div className={`cuisine-tickets__grid ${filteredTickets.length === 1 ? 'cuisine-tickets__grid--single' : ''}`}>
            {filteredTickets.map((ticket) => {
              const chip = getChip(ticket);
              const accent = ticket.statut === 'en_preparation' ? 'orange' : chip.tone;
              const headerLabel = ticket.table_numero ? `Table ${ticket.table_numero}` : 'À emporter';
              const rightMeta = `#${String(ticket.id_commande).padStart(3, '0')} — ${formatTimeHHMM(ticket.created_at)}`;

              return (
                <div key={ticket.id_commande} className={`cuisine-tickets__card cuisine-tickets__card--${accent}`}>
                  <div className="cuisine-tickets__card-top">
                    <div className={`cuisine-tickets__chip cuisine-tickets__chip--${chip.tone}`}>{chip.label}</div>
                    <div className="cuisine-tickets__meta">{rightMeta}</div>
                  </div>

                  <div className="cuisine-tickets__card-title">{headerLabel}</div>

                  <div className="cuisine-tickets__lines">
                    {(ticket.lignes || []).slice(0, 6).map((ligne) => (
                      <div key={ligne.id_ligne || `${ticket.id_commande}-${ligne.plat_nom}`} className="cuisine-tickets__line">
                        <span className="cuisine-tickets__bullet" />
                        <span className="cuisine-tickets__qty">{ligne.quantite}x</span>
                        <span className="cuisine-tickets__item">{ligne.plat_nom}</span>
                      </div>
                    ))}
                  </div>

                  <div className="cuisine-tickets__card-footer">
                    {ticket.statut === 'en_attente' ? (
                      <button
                        type="button"
                        className="cuisine-tickets__btn cuisine-tickets__btn--blue"
                        onClick={() => updateStatut(ticket, 'en_preparation')}
                      >
                        PRENDRE EN CHARGE
                      </button>
                    ) : null}
                    {ticket.statut === 'en_preparation' ? (
                      <button
                        type="button"
                        className="cuisine-tickets__btn cuisine-tickets__btn--green"
                        onClick={() => updateStatut(ticket, 'servie')}
                      >
                        MARQUER PRÊT
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {!filteredTickets.length ? (
            <div className="cuisine-tickets__empty">
              <div className="cuisine-tickets__empty-icon">✓</div>
              <div className="cuisine-tickets__empty-title">Aucun ticket</div>
              <div className="cuisine-tickets__empty-sub">Tout le travail a été traité pour le moment.</div>
            </div>
          ) : null}

          <div className="cuisine-tickets__stats">
            <div className="cuisine-tickets__stat">
              <div className="cuisine-tickets__stat-label">TEMPS MOYEN</div>
              <div className="cuisine-tickets__stat-value">{avgMinutes} min</div>
            </div>
            <div className="cuisine-tickets__stat">
              <div className="cuisine-tickets__stat-label">TICKETS COMPLÉTÉS</div>
              <div className="cuisine-tickets__stat-value">{completedTickets.length}</div>
            </div>
            <div className="cuisine-tickets__stat cuisine-tickets__stat--wide">
              <div className="cuisine-tickets__capacity">
                <div className="cuisine-tickets__capacity-bar">
                  <div className="cuisine-tickets__capacity-fill" style={{ width: `${kitchenCapacity}%` }} />
                </div>
                <div className="cuisine-tickets__capacity-label">CAPACITÉ CUISINE: {kitchenCapacity}%</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
