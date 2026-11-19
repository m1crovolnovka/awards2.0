import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { NetworkError } from '../api/client';
import { useAuth } from '../hooks/AuthContext';
import { useBackendStatus } from '../hooks/BackendStatus';
import { OfflinePage } from './ErrorPages';
import type { PublicConfig } from '../types';

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export function LandingPage() {
  const { user, loginWithToken } = useAuth();
  const { online, checking, recheck } = useBackendStatus();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    window.onTelegramAuth = async (tgUser) => {
      setLoadingAuth(true);
      setError('');
      try {
        const res = await api.loginTelegram(tgUser);
        loginWithToken(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка входа через Telegram');
      } finally {
        setLoadingAuth(false);
      }
    };

    const bot = config?.telegramBotUsername?.replace(/^@/, '');
    const enabled = config?.telegramAuthMode === 'widget' && bot && bot !== 'REPLACE_ME';

    if (!enabled || !slotRef.current) return;

    slotRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    slotRef.current.appendChild(script);

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [config, loginWithToken]);

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

  const widgetReady = config?.telegramAuthMode === 'widget';

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
            Войдите через Telegram Login: подтвердите вход в приложении — имя, username и фото
            подтянутся автоматически.
          </motion.p>

          {error && <div className="error-banner">{error}</div>}
          {loadingAuth && <div className="success-banner">Проверяем авторизацию Telegram…</div>}

          <div className="telegram-slot">
            {widgetReady ? (
              <div className="tg-widget-wrap">
                <div ref={slotRef} />
                <ol className="tg-steps">
                  <li>Нажмите кнопку «Log in with Telegram» ниже</li>
                  <li>Разрешите передачу имени, username и фото (телефон скрыт)</li>
                  <li>Подтвердите вход в официальном приложении Telegram («Принять»)</li>
                </ol>
              </div>
            ) : (
              <div className="panel" style={{ maxWidth: 560 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
                  Нужен Telegram-бот для Login Widget
                </h3>
                <p style={{ color: 'var(--muted)' }}>
                  Такой вход (с подтверждением в приложении) работает только через официальный
                  Telegram Login Widget. Создайте бота один раз:
                </p>
                <ol style={{ color: 'var(--silver)', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
                  <li>
                    Откройте <strong>@BotFather</strong> → <code>/newbot</code>
                  </li>
                  <li>
                    Скопируйте token → на Render: <code>TELEGRAM_BOT_TOKEN</code>
                  </li>
                  <li>
                    Имя бота без @ → <code>TELEGRAM_BOT_USERNAME</code>
                  </li>
                  <li>
                    BotFather → Bot Settings → Domain →{' '}
                    <code>frontend-eight-eosin-65.vercel.app</code>
                  </li>
                  <li>Redeploy бэкенда на Render</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
