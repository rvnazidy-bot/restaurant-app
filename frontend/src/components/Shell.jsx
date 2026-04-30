import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const linksByRole = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Menu', to: '/admin/menu' },
    { label: 'Personnel', to: '/admin/personnel' },
    { label: 'Historique', to: '/admin/historique' }
  ],
  staff: [
    { label: 'Tables', to: '/staff/tables' },
    { label: 'Commandes', to: '/staff/commandes' }
  ],
  cuisine: [{ label: 'Tickets', to: '/cuisine/tickets' }]
};

function getInitials(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[1]?.[0] || '' : parts[0]?.[1] || '';
  return (first + second).toUpperCase();
}

export default function Shell({
  title,
  subtitle,
  actions,
  children,
  hideHeader = false,
  layout = 'sidebar',
  topbarTitle = '',
  topbarActiveTab = '',
  topbarBrand = 'RESTOACKER',
  topbarRight = null,
  topbarRightVariant = '',
  topbarTabs = null
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = linksByRole[user?.role] || [];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
    setSidebarOpen(false);
  };

  const iconByLabel = {
    Dashboard: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"
        />
      </svg>
    ),
    Menu: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 3h12v2H6V3Zm0 8h12v2H6v-2Zm0 8h12v2H6v-2Z"
        />
      </svg>
    ),
    Personnel: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h7v-3.5c0-2.33-4.67-3.5-7-3.5Z"
        />
      </svg>
    ),
    Historique: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13 3a9 9 0 0 0-9 9H1l3.9 3.9.1.2L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3Zm-1 5v5l4.25 2.52.75-1.23-3.5-2.08V8h-1.5Z"
        />
      </svg>
    ),
    Tables: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 10V6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v4h-2V6H6v4H4Zm2 2h12l2 8h-2l-.5-2H6.5L6 20H4l2-8Zm1 6h10l-1-4H8l-1 4Z"
        />
      </svg>
    ),
    Commandes: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2h10v2H7V2Zm12 4H5c-1.1 0-2 .9-2 2v12h2v-2h14v2h2V8c0-1.1-.9-2-2-2Zm0 10H5V8h14v8ZM7 10h6v2H7v-2Zm0 4h10v2H7v-2Z"
        />
      </svg>
    ),
    Tickets: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 4h16v6a2 2 0 0 0 0 4v6H4v-6a2 2 0 0 0 0-4V4Zm4 4v2h8V8H8Zm0 6v2h6v-2H8Z"
        />
      </svg>
    )
  };

  if (layout === 'topbar') {
    const displayName = user?.nom || user?.name || user?.email || '';
    const displayRole = user?.role ? String(user.role) : '';
    const roleLabel =
      displayRole === 'staff'
        ? 'Serveur/Serveuse'
        : displayRole === 'admin'
          ? 'Admin'
          : displayRole === 'cuisine'
            ? 'Cuisine'
            : displayRole;

    return (
      <div className="topbar-shell">
        <div className="topbar">
          <div className="topbar__brand">{topbarBrand}</div>
          <div className="topbar__tabs">
            {Array.isArray(topbarTabs) && topbarTabs.length ? (
              topbarTabs.map((tab) => (
                <NavLink
                  key={tab.label}
                  to={tab.to}
                  className={({ isActive }) =>
                    `topbar__tab topbar__tablink ${(tab.active ?? isActive) ? 'topbar__tab--active' : ''}`.trim()
                  }
                  end
                >
                  {tab.label}
                </NavLink>
              ))
            ) : (
              <div className="topbar__tab topbar__tab--static">{topbarActiveTab || 'PLAN DE SALLE'}</div>
            )}
          </div>
          {topbarRightVariant === 'profile' ? (
            <div className="topbar__right">
              <button type="button" className="topbar__meta-btn" onClick={handleProfileClick}>
                Profil
              </button>
              <button type="button" className="topbar__logout" onClick={logout}>
                Deconnexion
              </button>
            </div>
          ) : topbarRight ? (
            <div className="topbar__right">{topbarRight}</div>
          ) : (
            <div className="topbar__right">
              <div className="topbar__user">
                <div className="topbar__user-name">{displayName}</div>
                <div className="topbar__user-role">{roleLabel}</div>
              </div>
              <div className="topbar__user-pill">{getInitials(displayName) || 'U'}</div>
              <button type="button" className="topbar__logout" onClick={logout}>
                Deconnexion
              </button>
            </div>
          )}
        </div>

        <main className="topbar-page">
          {topbarTitle ? <h1 className="topbar-page__title">{topbarTitle}</h1> : null}
          <div className="topbar-page__content">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`.trim()}>
        <div className="sidebar__brand">
          <img className="sidebar__brand-logo" src="/logo.jpg" alt="RestoAcker" />
          <div className="sidebar__brand-text">
            <strong>RestoAcker</strong>
            <span>ADMINISTRATION</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__icon">{iconByLabel[link.label] || null}</span>
              <span className="sidebar__label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__meta" onClick={handleProfileClick}>
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4v2h16v-2c0-2-3.58-4-8-4Z"
                />
              </svg>
            </span>
            <span className="sidebar__label">Profil</span>
          </button>
          <button
            type="button"
            className="sidebar__meta"
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
          >
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59ZM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Z"
                />
              </svg>
            </span>
            <span className="sidebar__label">Deconnexion</span>
          </button>
        </div>
      </aside>

      <main className="page-shell">
        <div className="sidebar-mobilebar">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
            </svg>
          </button>
        </div>

        {!hideHeader ? (
          <header className="page-header">
            <div>
              <h1>{title}</h1>
              {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="page-header__actions">{actions}</div> : null}
          </header>
        ) : null}
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
