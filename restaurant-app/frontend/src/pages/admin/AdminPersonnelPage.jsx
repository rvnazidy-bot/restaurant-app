import { useEffect, useState } from 'react';
import Shell from '../../components/Shell.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Skeleton } from '../../components/Loader.jsx';
import api, { extractApiError } from '../../services/api';
import { formatDateTime, statusLabelMap, statusToneMap } from '../../services/formatters.js';
import { useToast } from '../../components/ToastProvider.jsx';

const inviteDefaults = { nom: '', email: '', role: 'staff' };

export default function AdminPersonnelPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState(inviteDefaults);
  const [disableModal, setDisableModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null, form: inviteDefaults, saving: false });
  const [error, setError] = useState('');
  const { pushToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
      setError('');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/users/inviter', inviteForm);
      pushToast({
        tone: 'success',
        title: 'Invitation creee',
        message: data.invitation.preview || "L'email a ete prepare."
      });
      setInviteModal(false);
      setInviteForm(inviteDefaults);
      loadUsers();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Invitation impossible', message: extractApiError(err) });
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.put(`/users/${user.id_utilisateur}/statut`, { actif: !user.actif });
      pushToast({ tone: 'success', title: 'Compte mis a jour', message: `${user.nom} a ete mis a jour.` });
      loadUsers();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Action impossible', message: extractApiError(err) });
    }
  };

  const resendInvitation = async (user) => {
    try {
      const { data } = await api.post(`/users/renvoyer-invitation/${user.id_utilisateur}`);
      pushToast({
        tone: 'info',
        title: 'Invitation renvoyee',
        message: data.preview || "Le renvoi a ete effectue."
      });
      loadUsers();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Renvoi impossible', message: extractApiError(err) });
    }
  };

  const confirmDisable = async () => {
    if (!disableModal.user) return;
    await toggleStatus(disableModal.user);
    setDisableModal({ open: false, user: null });
  };

  const openEditModal = (user) => {
    setEditModal({
      open: true,
      user,
      saving: false,
      form: {
        nom: user?.nom || '',
        email: user?.email || '',
        role: user?.role || 'staff'
      }
    });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, user: null, form: inviteDefaults, saving: false });
  };

  const saveUserEdits = async () => {
    if (!editModal.user) return;

    const nom = String(editModal.form.nom || '').trim();
    const email = String(editModal.form.email || '').trim();
    const role = String(editModal.form.role || '').trim();

    if (!nom) {
      pushToast({ tone: 'error', title: 'Champ manquant', message: 'Le nom est requis.' });
      return;
    }

    if (!email) {
      pushToast({ tone: 'error', title: 'Champ manquant', message: "L'email est requis." });
      return;
    }

    setEditModal((current) => ({ ...current, saving: true }));
    try {
      await api.put(`/users/${editModal.user.id_utilisateur}`, { nom, email, role });
      pushToast({ tone: 'success', title: 'Utilisateur modifie', message: `${nom} a ete mis a jour.` });
      closeEditModal();
      loadUsers();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Modification impossible', message: extractApiError(err) });
    } finally {
      setEditModal((current) => ({ ...current, saving: false }));
    }
  };

  const staffCount = users.filter((u) => u.role === 'staff').length;
  const cuisineCount = users.filter((u) => u.role === 'cuisine').length;
  const activeCount = users.filter((u) => Boolean(u.actif)).length;

  const formatShortDate = (value) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return formatDateTime(value);
    }
  };

  return (
    <Shell
      title="Personnel"
      subtitle="Invitez, activez et gerez l'ensemble de l'equipe du restaurant."
      hideHeader
    >
      {error ? <EmptyState title="Personnel indisponible" description={error} /> : null}

      {!error && loading ? (
        <Card><Skeleton height={260} /></Card>
      ) : null}

      {!error && !loading ? (
        <div className="personnel-page">
          <div className="personnel-page__header">
            <div>
              <h2 className="personnel-page__title">Gestion du Personnel</h2>
              <p className="personnel-page__subtitle">Gerez les acces et les roles de votre equipe operationnelle.</p>
            </div>
            <Button className="personnel-page__invite" variant="secondary" onClick={() => setInviteModal(true)}>
              <span className="personnel-page__invite-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M15 12c2.21 0 4-1.79 4-4S17.21 4 15 4s-4 1.79-4 4 1.79 4 4 4Zm-9 0c2.21 0 4-1.79 4-4S8.21 4 6 4 2 5.79 2 8s1.79 4 4 4Zm0 2c-3.33 0-6 1.67-6 4v2h12v-2c0-2.33-2.67-4-6-4Zm9 0c-.42 0-.87.03-1.34.09 1.58 1.04 2.34 2.42 2.34 3.91v2h8v-2c0-2.33-2.67-4-6-4Z"
                  />
                </svg>
              </span>
              INVITER EMPLOYÉ
            </Button>
          </div>

          <Card className="personnel-table">
            <table className="table table--clean">
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>EMAIL</th>
                  <th>RÔLE</th>
                  <th>STATUT</th>
                  <th>DATE D'AJOUT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const pendingInvite = user.statut === 'invite' || (user.expire_le && !user.utilise);
                  const roleTone = user.role === 'admin' ? 'dark' : user.role === 'staff' ? 'info' : 'warning';
                  const roleLabel = statusLabelMap[user.role] || user.role;
                  const statusTone = user.actif ? 'success' : 'neutral';
                  const statusLabel = user.actif ? 'ACTIF' : 'INACTIF';
                  return (
                    <tr key={user.id_utilisateur}>
                      <td>
                        <div className="personnel-user">
                          <div className={`personnel-avatar ${user.actif ? '' : 'personnel-avatar--muted'}`} aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                              <path
                                fill="currentColor"
                                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4v2h16v-2c0-2-3.58-4-8-4Z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="personnel-user__name">{user.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td className="personnel-user__email">{user.email}</td>
                      <td><Badge tone={roleTone} className="personnel-pill">{roleLabel.toUpperCase()}</Badge></td>
                      <td><Badge tone={statusTone} className="personnel-pill">{statusLabel}</Badge></td>
                      <td>{formatShortDate(user.created_at)}</td>
                      <td>
                        <div className="personnel-actions">
                          {pendingInvite ? (
                            <button type="button" className="personnel-action" aria-label="Renvoyer invitation" onClick={() => resendInvitation(user)}>
                              <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M3 20V4l19 8-19 8Zm2-3 12.85-5L5 7v10Z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="personnel-action"
                              aria-label="Modifier"
                              onClick={() => openEditModal(user)}
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18">
                                <path
                                  fill="currentColor"
                                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75L21 5.75Z"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            className="personnel-action"
                            aria-label={user.actif ? 'Desactiver' : 'Reactiver'}
                            onClick={() =>
                              user.actif
                                ? setDisableModal({ open: true, user })
                                : toggleStatus(user)
                            }
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path fill="currentColor" d="M12 8a2 2 0 1 1-2 2 2 2 0 0 1 2-2Zm0 6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Zm0-12a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="personnel-bottom">
            <Card className="personnel-activity">
              <h3>Aperçu de l'activite equipe</h3>
              <div className="personnel-activity__box">Graphique des heures de service</div>
            </Card>
            <Card className="personnel-stats">
              <h3>Quick Stats</h3>
              <div className="personnel-stats__list">
                <div className="personnel-stats__row">
                  <span>Effectif total</span>
                  <strong>{users.length}</strong>
                </div>
                <div className="personnel-stats__row">
                  <span>En service</span>
                  <strong className="personnel-stats__good">{activeCount}</strong>
                </div>
                <div className="personnel-stats__row">
                  <span>Postes vacants</span>
                  <strong className="personnel-stats__bad">{Math.max(0, staffCount + cuisineCount ? 0 : 2)}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <Modal
        open={inviteModal}
        title="Inviter un employe"
        onClose={() => setInviteModal(false)}
        className="personnel-modal--invite"
        closeIcon
        footer={
          <>
            <Button className="personnel-invite__primary" variant="secondary" onClick={handleInvite}>
              ENVOYER L'INVITATION
            </Button>
            <Button className="personnel-invite__secondary" variant="ghost" onClick={() => setInviteModal(false)}>
              ANNULER
            </Button>
          </>
        }
      >
        <form className="stack" onSubmit={handleInvite}>
          <div className="personnel-invite__info">
            <div className="personnel-invite__info-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M11 17h2v-6h-2v6Zm1-8a1.25 1.25 0 1 0-1.25-1.25A1.25 1.25 0 0 0 12 9Zm0-7A10 10 0 1 0 22 12 10 10 0 0 0 12 2Z"
                />
              </svg>
            </div>
            <div>
              L'invitation sera envoyee par email. L'employe devra creer son mot de passe pour acceder a son interface staff.
            </div>
          </div>
          <Input
            label="NOM COMPLET"
            placeholder="ex: Marc Lefort"
            value={inviteForm.nom}
            onChange={(event) => setInviteForm((current) => ({ ...current, nom: event.target.value }))}
          />
          <Input
            label="EMAIL PROFESSIONNEL"
            placeholder="m.lefort@restoacker.com"
            type="email"
            value={inviteForm.email}
            onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
          />
          <label className="field">
            <span className="field__label">ROLE ASSIGNE</span>
            <select
              className="select"
              value={inviteForm.role}
              onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="staff">Serveur</option>
              <option value="cuisine">Cuisinier</option>
              <option value="admin">Gerant</option>
            </select>
          </label>
        </form>
      </Modal>

      <Modal
        open={disableModal.open}
        title=""
        onClose={() => setDisableModal({ open: false, user: null })}
        className="personnel-modal--disable"
        footer={null}
      >
        <div className="personnel-disable">
          <div className="personnel-disable__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"
              />
            </svg>
          </div>
          <h3 className="personnel-disable__title">Desactiver le compte</h3>
          <p className="personnel-disable__text">
            Etes-vous sur de vouloir desactiver le compte de <strong>{disableModal.user?.nom}</strong> ? Elle ne pourra plus se
            connecter au systeme jusqu'a reactivation.
          </p>
          <Button className="personnel-disable__cta" onClick={confirmDisable}>
            CONFIRMER LA DESACTIVATION
          </Button>
          <button type="button" className="personnel-disable__back" onClick={() => setDisableModal({ open: false, user: null })}>
            RETOUR
          </button>
        </div>
      </Modal>

      <Modal
        open={editModal.open}
        title="Modifier l'employe"
        onClose={closeEditModal}
        className="personnel-modal--invite"
        closeIcon
        footer={
          <>
            <Button
              className="personnel-invite__primary"
              variant="secondary"
              onClick={saveUserEdits}
              disabled={editModal.saving}
            >
              ENREGISTRER
            </Button>
            <Button
              className="personnel-invite__secondary"
              variant="ghost"
              onClick={closeEditModal}
              disabled={editModal.saving}
            >
              ANNULER
            </Button>
          </>
        }
      >
        <form className="stack" onSubmit={(event) => {
          event.preventDefault();
          saveUserEdits();
        }}>
          <Input
            label="NOM COMPLET"
            placeholder="ex: Marc Lefort"
            value={editModal.form.nom}
            onChange={(event) =>
              setEditModal((current) => ({ ...current, form: { ...current.form, nom: event.target.value } }))
            }
          />
          <Input
            label="EMAIL PROFESSIONNEL"
            placeholder="m.lefort@restoacker.com"
            type="email"
            value={editModal.form.email}
            onChange={(event) =>
              setEditModal((current) => ({ ...current, form: { ...current.form, email: event.target.value } }))
            }
          />
          <label className="field">
            <span className="field__label">ROLE ASSIGNE</span>
            <select
              className="select"
              value={editModal.form.role}
              onChange={(event) =>
                setEditModal((current) => ({ ...current, form: { ...current.form, role: event.target.value } }))
              }
            >
              <option value="staff">Serveur</option>
              <option value="cuisine">Cuisinier</option>
              <option value="admin">Gerant</option>
            </select>
          </label>
        </form>
      </Modal>
    </Shell>
  );
}
