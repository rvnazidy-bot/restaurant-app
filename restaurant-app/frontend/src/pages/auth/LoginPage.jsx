import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import { Spinner } from '../../components/Loader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { getDefaultRouteByRole } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validation côté frontend
    if (!form.email.trim()) {
      setError('L\'adresse email est requise.');
      return;
    }

    if (!form.mot_de_passe.trim()) {
      setError('Le mot de passe est requis.');
      return;
    }

    try {
      const user = await login(form);
      pushToast({
        tone: 'success',
        title: 'Connexion reussie',
        message: `Bienvenue ${user.nom}.`
      });
      navigate(getDefaultRouteByRole(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
      pushToast({
        tone: 'error',
        title: 'Connexion refusee',
        message: err.message
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-stack">
        {error ? (
          <div className="auth-alerts" role="alert" aria-live="polite">
            <div className="auth-banner auth-banner--error">
              <span className="auth-banner__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 10a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 17Z"
                  />
                </svg>
              </span>
              <span className="auth-banner__text">{error}</span>
            </div>
          </div>
        ) : null}

        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">
              <img className="auth-logo__img" src="/logo.jpg" alt="" />
            </div>
            <h1 className="auth-title">RestoAcker</h1>
            <p className="auth-subtitle">Connectez-vous a votre espace</p>
          </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              placeholder="ex: jean@restoacker.mg"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field__label">Mot de passe</span>
            <div className="field__password">
              <input
                className="field__input field__input--with-action"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                value={form.mot_de_passe}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mot_de_passe: event.target.value }))
                }
              />
              <button
                className="field__action"
                type="button"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPassword((value) => !value)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 5c-7.633 0-10 7-10 7s2.367 7 10 7 10-7 10-7-2.367-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                  />
                </svg>
              </button>
            </div>
          </label>

          <Button type="submit" variant="primary" size="lg" className="auth-submit" disabled={loading}>
            {loading ? <Spinner /> : 'Se connecter'}
          </Button>
        </form>

        <div className="auth-footer">
          Acces reserve au personnel RestoAcker
        </div>
      </div>
      </div>
    </div>
  );
}
