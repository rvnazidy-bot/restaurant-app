import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { extractApiError } from '../../services/api';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { Skeleton, Spinner } from '../../components/Loader.jsx';
import { useToast } from '../../components/ToastProvider.jsx';

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ mot_de_passe: '', confirmation: '' });

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/invitations/${token}`);
        setStatus(data.status);
        setMessage(data.message);
        setUser(data.user || null);
      } catch (error) {
        setStatus('invalid');
        setMessage(extractApiError(error));
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.mot_de_passe !== form.confirmation) {
      pushToast({
        tone: 'error',
        title: 'Confirmation invalide',
        message: 'Les deux mots de passe ne correspondent pas.'
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/invitations/${token}`, { mot_de_passe: form.mot_de_passe });
      pushToast({
        tone: 'success',
        title: 'Compte active',
        message: 'Vous pouvez maintenant vous connecter.'
      });
      navigate('/login', { replace: true });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Activation impossible',
        message: extractApiError(error)
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__mark">TS</span>
          <h1>Activation invitation</h1>
          <p>Configurez votre mot de passe pour entrer dans l'application.</p>
        </div>

        {loading ? (
          <div className="stack">
            <Skeleton height={18} />
            <Skeleton height={54} />
            <Skeleton height={54} />
            <Skeleton height={48} />
          </div>
        ) : null}

        {!loading && status === 'valid' ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="alert alert--success">
              Invitation valide pour <strong>{user?.nom}</strong> ({user?.role})
            </div>
            <Input
              label="Mot de passe"
              type="password"
              placeholder="Minimum 8 caracteres"
              value={form.mot_de_passe}
              onChange={(event) =>
                setForm((current) => ({ ...current, mot_de_passe: event.target.value }))
              }
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Retapez le mot de passe"
              value={form.confirmation}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirmation: event.target.value }))
              }
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner /> : 'Activer mon compte'}
            </Button>
          </form>
        ) : null}

        {!loading && status !== 'valid' ? (
          <div className="stack">
            <div className="alert alert--error">{message}</div>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Retour a la connexion
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
