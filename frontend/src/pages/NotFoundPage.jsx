import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__mark">TS</span>
          <h1>Page introuvable</h1>
          <p>Cette route n'existe pas dans l'application TSARALAZA.</p>
        </div>
        <Link to="/login">
          <Button size="lg">Retour a la connexion</Button>
        </Link>
      </div>
    </div>
  );
}
