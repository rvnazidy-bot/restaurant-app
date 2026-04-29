import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../../components/Shell.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';

export default function StaffTablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ libre: true, occupee: true, reservee: true });
  const [confirming, setConfirming] = useState(null);
  const [covers, setCovers] = useState(4);
  const navigate = useNavigate();

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data);
      setError('');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const updateStatus = async (tableId, statut) => {
    try {
      await api.put(`/tables/${tableId}/statut`, { statut });
      loadTables();
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const handleTableClick = (table) => {
    if (table.statut === 'libre') {
      setCovers(Math.max(1, Math.min(Number(table.capacite) || 1, Number(table.capacite) || 4)));
      setConfirming(table);
      return;
    }
    if (table.commande_active_id) {
      navigate('/staff/commandes');
    }
  };

  const confirmOpen = () => {
    if (!confirming) return;
    navigate(`/staff/nouvelle-commande/${confirming.id_table}`);
  };

  const formatSince = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return '';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'DEPUIS 1 MIN';
    if (minutes < 60) return `DEPUIS ${minutes} MIN`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `DEPUIS ${hours} H`;
    const days = Math.floor(hours / 24);
    return `DEPUIS ${days} J`;
  };

  const filteredTables = useMemo(() => {
    const query = String(search || '').trim().toLowerCase();
    return tables
      .filter((table) => Boolean(filters[table.statut]))
      .filter((table) => {
        if (!query) return true;
        const numero = String(table.numero ?? '').toLowerCase();
        return numero.includes(query) || `t${numero}`.includes(query);
      });
  }, [tables, filters, search]);

  return (
    <Shell
      layout="topbar"
      topbarActiveTab="PLAN DE SALLE"
      topbarTitle="Staff Plan de Salle"
      title=""
      subtitle=""
      hideHeader
    >
      {error ? <EmptyState title="Plan indisponible" description={error} /> : null}

      {!error && loading ? (
        <div className="staff-tables__loading">
          <Skeleton height={520} />
        </div>
      ) : null}

      {!error && !loading ? (
        <div className="staff-tables">
          <div className="staff-tables__toolbar">
            <div className="staff-tables__checks" role="group" aria-label="Filtrer par statut">
              <label className="staff-tables__check">
                <input
                  type="checkbox"
                  checked={filters.libre}
                  onChange={(event) => setFilters((current) => ({ ...current, libre: event.target.checked }))}
                />
                Libre
              </label>
              <label className="staff-tables__check">
                <input
                  type="checkbox"
                  checked={filters.occupee}
                  onChange={(event) => setFilters((current) => ({ ...current, occupee: event.target.checked }))}
                />
                Occupe
              </label>
              <label className="staff-tables__check">
                <input
                  type="checkbox"
                  checked={filters.reservee}
                  onChange={(event) => setFilters((current) => ({ ...current, reservee: event.target.checked }))}
                />
                Reserve
              </label>
            </div>

            <div className="staff-tables__search">
              <span className="staff-tables__search-icon" aria-hidden="true">Q</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="RECHERCHER TABLE"
                aria-label="Rechercher une table"
              />
            </div>
          </div>

          <div className="staff-tables__grid">
            {filteredTables.map((table) => {
              const title = `T${table.numero}`;
              const places = `${table.capacite} PLACES`;
              const isLibre = table.statut === 'libre';
              const since = table.commande_active_id ? formatSince(table.commande_active_created_at) : '';
              const actionLabel = isLibre ? '+ NOUV. COMMANDE' : 'VOIR COMMANDE';
              const actionVariant = isLibre ? 'primary' : 'secondary';

              return (
                <div
                  key={table.id_table}
                  className="staff-table-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTableClick(table)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') handleTableClick(table);
                  }}
                >
                  <div className="staff-table-card__top">
                    <div className="staff-table-card__title">{title}</div>
                    <div className="staff-table-card__places">{places}</div>
                  </div>

                  <div className="staff-table-card__meta">
                    {since || ' '}
                  </div>

                  <Button
                    variant={actionVariant}
                    size="sm"
                    className={`staff-table-card__action staff-table-card__action--${isLibre ? 'danger' : 'primary'}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isLibre) {
                        setCovers(Math.max(1, Math.min(Number(table.capacite) || 1, Number(table.capacite) || 4)));
                        setConfirming(table);
                        return;
                      }
                      handleTableClick(table);
                    }}
                  >
                    {actionLabel}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(confirming)}
        title={confirming ? `TABLE ${confirming.numero}` : ''}
        onClose={() => setConfirming(null)}
        className="staff-open-modal"
        backdropClassName="staff-open-backdrop"
        footer={
          <div className="staff-open-modal__footer">
            <Button className="staff-open-modal__confirm" onClick={confirmOpen}>
              CONFIRMER ET OUVRIR
            </Button>
            <Button variant="ghost" className="staff-open-modal__cancel" onClick={() => setConfirming(null)}>
              ANNULER
            </Button>
          </div>
        }
      >
        {confirming ? (
          <div className="staff-open-modal__content">
            <div className="staff-open-modal__title">
              <span className="staff-open-modal__title-bar" aria-hidden="true" />
              <span>{`TABLE ${confirming.numero}`}</span>
            </div>
            <div className="staff-open-modal__question">
              Confirmer l’ouverture d’une nouvelle commande pour cette table ?
            </div>

            <div className="staff-open-modal__label">Nombre de couverts</div>
            <div className="staff-open-modal__stepper" role="group" aria-label="Nombre de couverts">
              <button
                type="button"
                className="staff-open-modal__stepper-btn"
                onClick={() => setCovers((current) => Math.max(1, current - 1))}
              >
                -
              </button>
              <div className="staff-open-modal__stepper-value">{covers}</div>
              <button
                type="button"
                className="staff-open-modal__stepper-btn"
                onClick={() =>
                  setCovers((current) => Math.min(Number(confirming.capacite) || current + 1, current + 1))
                }
              >
                +
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Shell>
  );
}
