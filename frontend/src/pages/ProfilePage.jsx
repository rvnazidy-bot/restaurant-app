import Shell from '../components/Shell.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <Shell
      title="Profil"
      subtitle="Informations du compte"
      actions={(
        <Button variant="secondary" onClick={logout}>
          Déconnexion
        </Button>
      )}
    >
      <Card>
        <div className="stack">
          <div className="key-value">
            <div className="key-value__row">
              <span>Nom</span>
              <strong>{user?.nom || '-'}</strong>
            </div>
            <div className="key-value__row">
              <span>Email</span>
              <strong>{user?.email || '-'}</strong>
            </div>
            <div className="key-value__row">
              <span>Rôle</span>
              <strong>{user?.role || '-'}</strong>
            </div>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
