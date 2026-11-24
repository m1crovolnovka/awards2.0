import { useEffect, useRef } from 'react';

/**
 * Official Telegram Login Widget for websites.
 * After login Telegram redirects to /auth/telegram?...
 * https://core.telegram.org/widgets/login
 */
export function TelegramLoginWidget({ botUsername }: { botUsername: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bot = botUsername.replace(/^@/, '').trim();
    if (!bot || !hostRef.current) return;

    hostRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-auth-url', `${window.location.origin}/auth/telegram`);
    hostRef.current.appendChild(script);
  }, [botUsername]);

  return <div className="tg-official-widget" ref={hostRef} />;
}
