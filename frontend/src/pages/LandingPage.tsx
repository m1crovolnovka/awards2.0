import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { NetworkError } from '../api/client';
import { useAuth } from '../hooks/AuthContext';
import { useBackendStatus } from '../hooks/BackendStatus';
import { OfflinePage } from './ErrorPages';

/**
 * Web-only Telegram-style login.
 * No Telegram app / SMS / oauth phone codes — user signs in with @username on the website.
 */
export function LandingPage() {
  const { user, loginWithToken } = useAuth();
  const { online, checking, recheck } = useBackendStatus();
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (online === false) return;
    void api
      .getConfig()
      .then(() => setReady(true))
      .catch((e) => {
        if (e instanceof NetworkError) return;
        // Even if config fails, allow trying login — backend may still accept lite auth
        setReady(true);
        setError(e instanceof Error ? e.message : 'Ошибка конфигурации');
      });
  }, [online]);

  if (checking && online === null) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <p>CONNECTING</p>
      </div>
    );
  }

  if (online === false) {
    return <OfflinePage onRetry={() => void recheck()} />;
  }

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'USER') return <Navigate to="/vote" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.loginTelegramLite(username, displayName || username);
      loginWithToken(res);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">GROUP AWARDS</span>
          <span className="brand-sub">Season Finale</span>
        </div>
        <Link className="admin-link" to="/admin/login">
          Admin
        </Link>
      </header>

      <section className="landing-hero">
        <div className="swoosh" />
        <div className="landing-content">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--silver)' }}
          >
            Lights out and away we go
          </motion.p>
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            Премия
            <br />
            <span>группы</span>
          </motion.h1>
          <motion.p
            className="lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Веб-голосование. Войдите через Telegram прямо на сайте — приложение не нужно.
          </motion.p>

          {error && !modalOpen && <div className="error-banner">{error}</div>}

          <div className="telegram-slot">
            <button
              type="button"
              className="tg-login-btn"
              disabled={!ready}
              onClick={() => {
                setError('');
                setModalOpen(true);
              }}
            >
              <TelegramIcon />
              Войти через Telegram
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.form
              className="modal-panel"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void onSubmit(e)}
            >
              <h2>Войти через Telegram</h2>
              <p>Введите ваш Telegram username. Приложение Telegram и коды не нужны.</p>
              {error && <div className="error-banner">{error}</div>}
              <div className="field">
                <label>Telegram @username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@nickname"
                  required
                  minLength={2}
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label>Имя (необязательно)</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Как показывать при голосовании"
                  autoComplete="nickname"
                />
              </div>
              <div className="actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Вход…' : 'Войти'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setModalOpen(false)}>
                  Отмена
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.5 3.5 2.8 10.7c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.7.4.9 1 .9.6 0 .8-.3 1.1-.6l2.7-2.6 5.6 4.1c1 .6 1.8.3 2.1-.9l3.7-17.5c.4-1.5-.5-2.2-1.8-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
