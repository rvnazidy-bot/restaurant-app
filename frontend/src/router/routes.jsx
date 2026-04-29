import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getDefaultRouteByRole } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import InvitationPage from '../pages/auth/InvitationPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminMenuPage from '../pages/admin/AdminMenuPage.jsx';
import AdminPersonnelPage from '../pages/admin/AdminPersonnelPage.jsx';
import AdminHistoriquePage from '../pages/admin/AdminHistoriquePage.jsx';
import StaffTablesPage from '../pages/staff/StaffTablesPage.jsx';
import StaffCommandesPage from '../pages/staff/StaffCommandesPage.jsx';
import StaffNouvelleCommandePage from '../pages/staff/StaffNouvelleCommandePage.jsx';
import CuisineTicketsPage from '../pages/cuisine/CuisineTicketsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? getDefaultRouteByRole(user.role) : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invitation/:token" element={<InvitationPage />} />

      <Route element={<ProtectedRoute roles={['admin', 'staff', 'cuisine']} />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/menu" element={<AdminMenuPage />} />
        <Route path="/admin/personnel" element={<AdminPersonnelPage />} />
        <Route path="/admin/historique" element={<AdminHistoriquePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['staff', 'admin']} />}>
        <Route path="/staff/tables" element={<StaffTablesPage />} />
        <Route path="/staff/commandes" element={<StaffCommandesPage />} />
        <Route path="/staff/nouvelle-commande/:id_table" element={<StaffNouvelleCommandePage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['cuisine', 'admin']} />}>
        <Route path="/cuisine/tickets" element={<CuisineTicketsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
