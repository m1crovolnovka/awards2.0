import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../api/endpoints';
import { useAuth } from '../hooks/AuthContext';

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export function LandingPage() {
  const { user, loginWithToken } = useAuth();
  const [bot, setBot] = useState('');
  const [error, setError] = useState('');
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api.getConfig().then((c) => setBot(c.telegramBotUsername)).catch(() => setBot(''));
  }, []);

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

    if (!bot || bot === 'REPLACE_ME' || !slotRef.current) return;

    slotRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '0');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    slotRef.current.appendChild(script);

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [bot, loginWithToken]);

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'USER') return <Navigate to="/vote" replace />;

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
            Войдите через Telegram, выберите номинацию и отдайте голос за одного номинанта.
            Стиль трассы. Скорость решения.
          </motion.p>

          {error && <div className="error-banner">{error}</div>}

          <div className="telegram-slot">
            {bot && bot !== 'REPLACE_ME' ? (
              <div ref={slotRef} />
            ) : (
              <div className="panel" style={{ maxWidth: 420 }}>
                <p style={{ marginTop: 0 }}>
                  Telegram-бот ещё не настроен. Для локальной проверки можно войти в demo-режиме:
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() =>
                    void api
                      .loginTelegram({
                        id: 900001,
                        first_name: 'Demo',
                        username: 'demo_user',
                        auth_date: Math.floor(Date.now() / 1000),
                        hash: 'dev',
                      })
                      .then(loginWithToken)
                      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка demo-входа'))
                  }
                >
                  Demo Login
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
