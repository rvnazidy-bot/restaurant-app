import { useEffect, useMemo, useState } from 'react';
import Shell from '../../components/Shell.jsx';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';
import { formatDateTime, statusLabelMap, statusToneMap } from '../../services/formatters.js';

export default function AdminHistoriquePage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start: '', end: '', statut: '', table: '' });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const formatEuro = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const splitName = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return { first: '-', lastInitial: '' };
    const parts = raw.split(/\s+/);
    const first = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    return { first, lastInitial: last ? `${last.charAt(0).toUpperCase()}.` : '' };
  };

  const normalizeStatus = (value) => {
    const v = String(value || '').toLowerCase();
    if (v.startsWith('annul')) return 'annulee';
    return v;
  };

  const parseDateInput = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    // Accept ISO: yyyy-mm-dd (from native date input)
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Accept FR: dd/mm/yyyy
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!day || !month || !year) return null;
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const loadCommandes = async () => {
    setLoading(true);
    try {
      const params = {
        scope: 'history'
      };
      const { data } = await api.get('/commandes', { params });
      setCommandes(data);
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

  useEffect(() => {
    setPage(1);
  }, [filters.start, filters.statut, filters.table]);

  const loadDetail = async (id) => {
    try {
      const { data } = await api.get(`/commandes/${id}`);
      setSelected(data);
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const rows = useMemo(() => {
    const selectedDate = parseDateInput(filters.start);
    const selectedDateMs = selectedDate 
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() 
      : null;
    const nextDayMs = selectedDate 
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1).getTime() 
      : null;

    return (commandes || [])
      .filter((c) => {
        if (filters.statut && String(c.statut) !== String(filters.statut)) return false;

        if (filters.table) {
          const t = String(c.table_numero ?? '').trim();
          if (t !== String(filters.table).trim()) return false;
        }

        if (!selectedDateMs) return true;
        const ts = new Date(c.created_at).getTime();
        if (Number.isNaN(ts)) return true;
        return ts >= selectedDateMs && ts < nextDayMs;
      })
      .map((c) => ({
        ...c,
        __statutNormalized: normalizeStatus(c.statut)
      }));
  }, [commandes, filters.start, filters.statut, filters.table]);

  const tableOptions = useMemo(() => {
    const set = new Set();
    for (const c of commandes || []) {
      if (c.table_numero != null && String(c.table_numero).trim()) set.add(String(c.table_numero));
    }
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [commandes]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const periodTotal = rows.reduce((acc, c) => acc + Number(c.total || 0), 0);
  const avgBasket = rows.length ? periodTotal / rows.length : 0;
  const cancelCount = rows.filter((c) => c.__statutNormalized === 'annulee').length;
  const cancelRate = rows.length ? (cancelCount / rows.length) * 100 : 0;

  const exportCsv = () => {
    const header = ['#', 'Date/Heure', 'Table', 'Plats', 'Montant', 'Statut', 'Serveur'];
    const escape = (v) => {
      const s = String(v ?? '');
      if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [header.join(',')];
    for (const c of rows) {
      lines.push(
        [
          c.id_commande,
          formatDateTime(c.created_at),
          c.table_numero,
          c.resume || '',
          formatEuro(c.total),
          statusLabelMap[c.statut] || c.statut,
          c.serveur_nom
        ]
          .map(escape)
          .join(',')
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique-commandes.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatComma = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

  return (
    <Shell title="Historique" subtitle="Consultez les commandes, filtres et details de service." hideHeader>
      <div className="historique-page">
        <div className="historique-header">
          <div>
            <h2 className="historique-title">Historique des commandes</h2>
            <p className="historique-subtitle">Consultez et exportez l'integralite de vos transactions passees.</p>
          </div>
          <div className="historique-header__icons" aria-hidden="true">
            <button
              type="button"
              className="historique-icon-btn"
              onClick={loadCommandes}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <Card className="historique-filters">
          <div className="historique-filters__grid">
            <div className="historique-field">
              <div className="historique-field__label">Date</div>
              <input
                className="historique-input"
                type="date"
                value={filters.start}
                onChange={(event) => setFilters((c) => ({ ...c, start: event.target.value }))}
              />
            </div>

            <div className="historique-field">
              <div className="historique-field__label">Statut</div>
              <select
                className="historique-input"
                value={filters.statut}
                onChange={(event) => setFilters((c) => ({ ...c, statut: event.target.value }))}
              >
                <option value="">Tous les statuts</option>
                <option value="payee">Payée</option>
                <option value="en_attente">En attente</option>
                <option value="en_preparation">En préparation</option>
                <option value="servie">Servie</option>
              </select>
            </div>

            <div className="historique-field">
              <div className="historique-field__label">Table</div>
              <select
                className="historique-input"
                value={filters.table}
                onChange={(event) => setFilters((c) => ({ ...c, table: String(event.target.value || '').trim() }))}
              >
                <option value="">Toutes</option>
                {tableOptions.map((t) => (
                  <option key={t} value={t}>
                    Table {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="historique-actions">
              <button type="button" className="historique-btn historique-btn--export" onClick={exportCsv}>
                <span className="historique-btn__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="currentColor"
                      d="M5 20h14v-2H5v2Zm7-18-5.5 5.5 1.42 1.42L11 6.84V16h2V6.84l3.08 3.08 1.42-1.42L12 2Z"
                    />
                  </svg>
                </span>
                EXPORT CSV
              </button>
            </div>
          </div>
        </Card>

        <Card className="historique-table">
          {error ? <EmptyState title="Historique indisponible" description={error} /> : null}
          {!error && loading ? <Skeleton height={260} /> : null}

          {!error && !loading ? (
            <>
              <table className="table table--clean">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date/Heure</th>
                    <th>Table</th>
                    <th>Plats</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Serveur</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((commande) => {
                    const dt = new Date(commande.created_at);
                    const date = Number.isNaN(dt.getTime())
                      ? ''
                      : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    const time = Number.isNaN(dt.getTime())
                      ? ''
                      : dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const name = splitName(commande.serveur_nom);
                    const tone = statusToneMap[commande.statut] || 'neutral';

                    return (
                      <tr key={commande.id_commande}>
                        <td className="historique-cell--id">{commande.id_commande}</td>
                        <td>
                          <div className="historique-date">
                            <div className="historique-date__d">{date}</div>
                            <div className="historique-date__t">{time}</div>
                          </div>
                        </td>
                        <td className="historique-cell--table">{commande.table_numero ? `Table ${commande.table_numero}` : '-'}</td>
                        <td className="historique-cell--plats">{commande.resume || '-'}</td>
                        <td>
                          <div className="historique-money">
                            <div className="historique-money__v">{formatEuro(commande.total)}</div>
                            <div className="historique-money__c">€</div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={tone} className="historique-status">
                            {(statusLabelMap[commande.statut] || commande.statut).toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <button type="button" className="historique-serveur" onClick={() => loadDetail(commande.id_commande)}>
                            <span>{name.first}</span>
                            <span className="historique-serveur__muted">{name.lastInitial}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="historique-footer">
                <div className="historique-footer__left">
                  Affichage de {paged.length} sur {formatComma(rows.length)} commandes
                </div>
                <div className="historique-pager">
                  <button
                    type="button"
                    className="historique-pagebtn"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Précédent
                  </button>

                  {Array.from({ length: Math.min(3, totalPages) }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`historique-pagechip ${p === safePage ? 'historique-pagechip--active' : ''}`.trim()}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="historique-pagebtn"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant ›
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        <div className="historique-stats">
          <Card className="historique-stat">
            <div className="historique-stat__k">TOTAL PÉRIODE</div>
            <div className="historique-stat__v">{formatEuro(periodTotal)} €</div>
          </Card>
          <Card className="historique-stat">
            <div className="historique-stat__k">COMMANDES</div>
            <div className="historique-stat__v">{rows.length}</div>
          </Card>
          <Card className="historique-stat">
            <div className="historique-stat__k">PANIER MOYEN</div>
            <div className="historique-stat__v">{formatEuro(avgBasket)} €</div>
          </Card>
          <Card className="historique-stat">
            <div className="historique-stat__k">TAUX D'ANNULATION</div>
            <div className="historique-stat__v">{(Math.round(cancelRate * 10) / 10).toFixed(1)}%</div>
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? `Detail commande #${selected.id_commande}` : 'Detail commande'}
        size="lg"
        onClose={() => setSelected(null)}
        footer={<Button onClick={() => setSelected(null)}>Fermer</Button>}
      >
        {selected ? (
          <div className="stack">
            <div className="key-value">
              <div className="key-value__row"><span>Table</span><strong>{selected.table_numero}</strong></div>
              <div className="key-value__row"><span>Serveur</span><strong>{selected.serveur_nom}</strong></div>
              <div className="key-value__row"><span>Statut</span><Badge tone={statusToneMap[selected.statut]}>{statusLabelMap[selected.statut]}</Badge></div>
              <div className="key-value__row"><span>Heure</span><strong>{formatDateTime(selected.created_at)}</strong></div>
            </div>
            <div className="divider" />
            <div className="order-lines">
              {selected.lignes.map((ligne) => (
                <div key={ligne.id_ligne} className="order-line">
                  <div>
                    <strong>{ligne.plat_nom}</strong>
                    <div className="muted">{ligne.notes || 'Aucune note'}</div>
                  </div>
                  <div>
                    {ligne.quantite} x {formatEuro(ligne.prix_unitaire)} €
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Total</span>
              <span>{formatEuro(selected.total)} €</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </Shell>
  );
}
