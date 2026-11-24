import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/AuthContext';
import { BackendStatusProvider } from './hooks/BackendStatus';
import { AdminChangePasswordPage } from './pages/AdminChangePasswordPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from './pages/ErrorPages';
import { LandingPage } from './pages/LandingPage';
import { NominationPage } from './pages/NominationPage';
import { TelegramCallbackPage } from './pages/TelegramCallbackPage';
import { VoteHomePage } from './pages/VoteHomePage';

export default function App() {
  return (
    <BackendStatusProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/telegram" element={<TelegramCallbackPage />} />
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
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BackendStatusProvider>
  );
}
