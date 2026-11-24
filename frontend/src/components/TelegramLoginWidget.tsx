import { useEffect, useRef } from 'react';

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
 *
 * Embeds:
 * <script src="https://oauth.telegram.org/js/telegram-login.js">
 * <button class="tg-auth-button">Sign In with Telegram</button>
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

  useEffect(() => {
    if (!clientId || !hostRef.current) return;

    const handleAuth = (data: TelegramOidcCallback) => {
      if (data?.error) {
        onError?.(data.error);
        return;
      }
      if (data?.id_token) {
        onSuccess(data.id_token);
        return;
      }
      onError?.('Telegram не вернул id_token');
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

    // Prefer JS API when available (more reliable than only data-onauth)
    script.onload = () => {
      try {
        window.Telegram?.Login?.init?.(
          { client_id: clientId, scope: ['profile', 'write'], lang: 'ru' },
          handleAuth,
        );
      } catch {
        /* widget still works via data-onauth */
      }
    };

    hostRef.current.appendChild(script);
    hostRef.current.appendChild(button);

    // Custom click: open popup via API if present
    const onClick = () => {
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
