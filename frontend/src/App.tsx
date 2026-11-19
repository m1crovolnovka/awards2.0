import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/AuthContext';
import { AdminChangePasswordPage } from './pages/AdminChangePasswordPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { LandingPage } from './pages/LandingPage';
import { NominationPage } from './pages/NominationPage';
import { VoteHomePage } from './pages/VoteHomePage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote"
          element={
            <ProtectedRoute role="USER">
              <VoteHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote/:id"
          element={
            <ProtectedRoute role="USER">
              <NominationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
