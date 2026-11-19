import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import * as api from '../api/endpoints';
import { useAuth } from '../hooks/AuthContext';

export function AdminLoginPage() {
  const { user, loginWithToken } = useAuth();
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role === 'ADMIN') {
    return <Navigate to={user.mustChangePassword ? '/admin/change-password' : '/admin'} replace />;
  }
  if (user?.role === 'USER') return <Navigate to="/vote" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.loginAdmin(login, password);
      loginWithToken(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Race Control</span>
        </div>
        <Link className="admin-link" to="/">
          Назад
        </Link>
      </header>
      <main className="page" style={{ maxWidth: 460, paddingTop: '4rem' }}>
        <h1 className="hero-title" style={{ fontSize: '2.6rem' }}>
          Admin
        </h1>
        <p className="lead">Вход только для администратора.</p>
        {error && <div className="error-banner">{error}</div>}
        <form className="panel" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="login">Логин</label>
            <input id="login" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </main>
    </div>
  );
}
