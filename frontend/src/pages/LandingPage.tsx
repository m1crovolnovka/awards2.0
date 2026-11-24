import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { NetworkError } from '../api/client';
import { TelegramLoginWidget } from '../components/TelegramLoginWidget';
import { useAuth } from '../hooks/AuthContext';
import { useBackendStatus } from '../hooks/BackendStatus';
import { OfflinePage } from './ErrorPages';
import type { PublicConfig } from '../types';

export function LandingPage() {
  const { user, loginWithToken } = useAuth();
  const { online, checking, recheck } = useBackendStatus();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [altOpen, setAltOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (online === false) return;
    void api
      .getConfig()
      .then(setConfig)
      .catch((e) => {
        if (e instanceof NetworkError) return;
        setError(e instanceof Error ? e.message : 'Ошибка конфигурации');
      });
  }, [online]);

  const onOidcSuccess = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.loginTelegramOidc(idToken);
        loginWithToken(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка авторизации Telegram');
      } finally {
        setLoading(false);
      }
    },
    [loginWithToken],
  );

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

  const clientId = config?.telegramClientId ?? 0;
  const oidcReady = config?.telegramAuthMode === 'oidc' && clientId > 0;

  const onAltSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.loginTelegramLite(username, displayName || username);
      loginWithToken(res);
      setAltOpen(false);
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
            Вход через Telegram Login — как на{' '}
            <a href="https://core.telegram.org/bots/telegram-login" target="_blank" rel="noreferrer">
              core.telegram.org
            </a>
            .
          </motion.p>

          {error && !altOpen && <div className="error-banner">{error}</div>}
          {loading && <div className="success-banner">Авторизация через Telegram…</div>}

          <div className="telegram-slot">
            {oidcReady ? (
              <div className="tg-widget-wrap">
                <TelegramLoginWidget
                  clientId={clientId}
                  onSuccess={(token) => void onOidcSuccess(token)}
                  onError={(msg) => setError(msg)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setError('');
                    setAltOpen(true);
                  }}
                >
                  Запасной вход по @username
                </button>
              </div>
            ) : (
              <div className="tg-widget-wrap">
                <div className="panel" style={{ maxWidth: 560 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
                    Настройте Telegram Login (OIDC)
                  </h3>
                  <ol style={{ color: 'var(--silver)', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
                    <li>
                      Откройте <strong>@BotFather</strong> → ваш бот → <strong>Login Widget</strong>
                    </li>
                    <li>
                      Allowed URLs добавьте:{' '}
                      <code>https://frontend-eight-eosin-65.vercel.app</code>
                    </li>
                    <li>
                      Скопируйте <strong>Client ID</strong>
                    </li>
                    <li>
                      На Render: <code>TELEGRAM_CLIENT_ID</code>=Client ID
                    </li>
                    <li>Redeploy бэкенда</li>
                  </ol>
                  <button
                    type="button"
                    className="tg-login-btn"
                    onClick={() => {
                      setError('');
                      setAltOpen(true);
                    }}
                  >
                    <TelegramIcon />
                    Пока войти по @username
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {altOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAltOpen(false)}
          >
            <motion.form
              className="modal-panel"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void onAltSubmit(e)}
            >
              <h2>Вход по @username</h2>
              <p>Временный веб-вход, пока не настроен Client ID.</p>
              {error && <div className="error-banner">{error}</div>}
              <div className="field">
                <label>@username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@nickname"
                  required
                  minLength={2}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Имя (необязательно)</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Как показывать"
                />
              </div>
              <div className="actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Вход…' : 'Войти'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setAltOpen(false)}>
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
