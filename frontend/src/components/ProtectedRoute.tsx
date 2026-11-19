import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { ForbiddenPage } from '../pages/ErrorPages';
import type { Role } from '../types';

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <p>LOADING</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/'} replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <ForbiddenPage />;
  }

  if (user.role === 'ADMIN' && user.mustChangePassword && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  return <>{children}</>;
}
