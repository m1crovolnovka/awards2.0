import { useEffect, useRef } from 'react';
import { isSilentTelegramError } from '../utils/telegramErrors';

declare global {
  interface Window {
    onTelegramOidcAuth?: (data: TelegramOidcCallback) => void;
    Telegram?: {
      Login?: {
        init?: (
          options: { client_id: number; scope?: string[]; lang?: string },
          callback: (data: TelegramOidcCallback) => void,
        ) => void;
        open?: (callback?: (data: TelegramOidcCallback) => void) => void;
        auth?: (
          options: { client_id: number; scope?: string[]; lang?: string },
          callback: (data: TelegramOidcCallback) => void,
        ) => void;
      };
    };
  }
}

export type TelegramOidcCallback = {
  id_token?: string;
  user?: Record<string, unknown>;
  error?: string;
};

/**
 * New Telegram Login library button.
 * https://core.telegram.org/bots/telegram-login
 */
export function TelegramLoginWidget({
  clientId,
  onSuccess,
  onError,
}: {
  clientId: number;
  onSuccess: (idToken: string) => void;
  onError?: (message: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(false);

  useEffect(() => {
    if (!clientId || !hostRef.current) return;
    successRef.current = false;

    const handleAuth = (data: TelegramOidcCallback) => {
      if (data?.id_token) {
        successRef.current = true;
        onSuccess(data.id_token);
        return;
      }
      if (data?.error) {
        // User closed popup after success, or cancelled — never show these
        if (successRef.current || isSilentTelegramError(data.error)) {
          return;
        }
        onError?.(data.error);
        return;
      }
    };

    window.onTelegramOidcAuth = handleAuth;
    hostRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://oauth.telegram.org/js/telegram-login.js?6';
    script.setAttribute('data-client-id', String(clientId));
    script.setAttribute('data-onauth', 'onTelegramOidcAuth(data)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tg-auth-button';
    button.textContent = 'Sign In with Telegram';

    script.onload = () => {
      try {
        window.Telegram?.Login?.init?.(
          { client_id: clientId, scope: ['profile', 'write'], lang: 'ru' },
          handleAuth,
        );
      } catch {
        /* data-onauth still works */
      }
    };

    hostRef.current.appendChild(script);
    hostRef.current.appendChild(button);

    const onClick = () => {
      successRef.current = false;
      if (window.Telegram?.Login?.auth) {
        window.Telegram.Login.auth(
          { client_id: clientId, scope: ['profile', 'write'], lang: 'ru' },
          handleAuth,
        );
      } else if (window.Telegram?.Login?.open) {
        window.Telegram.Login.open(handleAuth);
      }
    };
    button.addEventListener('click', onClick);

    return () => {
      button.removeEventListener('click', onClick);
      window.onTelegramOidcAuth = undefined;
    };
  }, [clientId, onSuccess, onError]);

  return <div className="tg-official-widget" ref={hostRef} />;
}
