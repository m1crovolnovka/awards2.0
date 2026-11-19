import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import * as api from '../api/endpoints';
import { useAuth } from '../hooks/AuthContext';

export function AdminChangePasswordPage() {
  const { user, loginWithToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.changeAdminCredentials(currentPassword, newLogin, newPassword);
      loginWithToken(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Security</span>
        </div>
      </header>
      <main className="page" style={{ maxWidth: 520 }}>
        <h1 className="hero-title" style={{ fontSize: '2.4rem' }}>
          Смена логина и пароля
        </h1>
        <p className="lead">Перед работой смените стандартные учётные данные.</p>
        {error && <div className="error-banner">{error}</div>}
        <form className="panel" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Текущий пароль</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Новый логин</label>
            <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} minLength={3} required />
          </div>
          <div className="field">
            <label>Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Сохранить
          </button>
        </form>
      </main>
    </div>
  );
}
