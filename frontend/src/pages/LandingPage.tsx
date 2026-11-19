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
  const [widgetReady, setWidgetReady] = useState(false);
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
      try {
        setError('');
        const res = await api.loginTelegram(tgUser);
        loginWithToken(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка входа через Telegram');
      }
    };

    const bot = config?.telegramBotUsername;
    const canWidget =
      config?.telegramAuthMode === 'widget' &&
      !!bot &&
      bot !== 'REPLACE_ME' &&
      !!slotRef.current;

    if (!canWidget) {
      setWidgetReady(false);
      return;
    }

    slotRef.current!.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '4');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.onload = () => setWidgetReady(true);
    slotRef.current!.appendChild(script);

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

  const botConfigured = config?.telegramAuthMode === 'widget';

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
            Войдите через Telegram одной кнопкой — без ручного ввода имени.
          </motion.p>

          {error && <div className="error-banner">{error}</div>}

          <div className="telegram-slot">
            {botConfigured ? (
              <div>
                <div ref={slotRef} />
                {!widgetReady && (
                  <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>Загрузка Telegram…</p>
                )}
              </div>
            ) : (
              <div className="panel" style={{ maxWidth: 520 }}>
                <p style={{ marginTop: 0 }}>
                  Чтобы вход шёл через Telegram без ручного ввода, на бэкенде (Render) задайте:
                </p>
                <ul style={{ color: 'var(--silver)', lineHeight: 1.6 }}>
                  <li>
                    <code>TELEGRAM_BOT_TOKEN</code>
                  </li>
                  <li>
                    <code>TELEGRAM_BOT_USERNAME</code> — имя бота без @
                  </li>
                </ul>
                <p style={{ color: 'var(--muted)' }}>
                  В @BotFather → Bot Settings → Domain укажите домен фронта:
                  <br />
                  <code>frontend-eight-eosin-65.vercel.app</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
