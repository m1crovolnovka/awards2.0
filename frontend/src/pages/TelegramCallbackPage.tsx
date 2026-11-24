import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api/endpoints';
import { useAuth } from '../hooks/AuthContext';

function pick(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v == null || v === '' ? undefined : v;
}

export function TelegramCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const id = pick(params, 'id');
    const hash = pick(params, 'hash');
    const authDate = pick(params, 'auth_date');

    if (!id || !hash || !authDate) {
      setError('Telegram не вернул данные авторизации. Попробуйте войти ещё раз.');
      return;
    }

    const payload: Record<string, unknown> = {
      id: Number(id),
      auth_date: Number(authDate),
      hash,
    };

    const firstName = pick(params, 'first_name');
    const lastName = pick(params, 'last_name');
    const username = pick(params, 'username');
    const photoUrl = pick(params, 'photo_url');
    if (firstName) payload.first_name = firstName;
    if (lastName) payload.last_name = lastName;
    if (username) payload.username = username;
    if (photoUrl) payload.photo_url = photoUrl;

    void (async () => {
      try {
        const res = await api.loginTelegram(payload);
        loginWithToken(res);
        navigate(res.user.role === 'ADMIN' ? '/admin' : '/vote', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось войти через Telegram');
      }
    })();
  }, [params, loginWithToken, navigate]);

  return (
    <div className="boot-screen">
      {error ? (
        <>
          <div className="error-banner" style={{ maxWidth: 420 }}>
            {error}
          </div>
          <Link className="btn btn-primary" to="/">
            На главную
          </Link>
        </>
      ) : (
        <>
          <div className="boot-spinner" />
          <p>TELEGRAM AUTH</p>
        </>
      )}
    </div>
  );
}
