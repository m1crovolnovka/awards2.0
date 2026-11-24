# Telegram Login (как на core.telegram.org/bots/telegram-login)

Используется **новая** библиотека:

```html
<script async src="https://oauth.telegram.org/js/telegram-login.js?6"
  data-client-id="YOUR_CLIENT_ID"
  data-onauth="onTelegramOidcAuth(data)"
  data-request-access="write"></script>
<button class="tg-auth-button">Sign In with Telegram</button>
```

Бэкенд проверяет `id_token` через JWKS: `https://oauth.telegram.org/.well-known/jwks.json`.

## Настройка в BotFather

1. Создайте бота (`/newbot`), если ещё нет  
2. Откройте **@BotFather mini app** → выберите бота → **Login Widget**  
3. **Allowed URLs** добавьте:
   - `https://frontend-eight-eosin-65.vercel.app`
4. Скопируйте **Client ID** (и при желании Client Secret)

## Env на Render

```text
TELEGRAM_CLIENT_ID=<Client ID из BotFather Login Widget>
TELEGRAM_BOT_TOKEN=<токен бота>
TELEGRAM_BOT_USERNAME=<username бота без @>
CORS_ORIGINS=https://frontend-eight-eosin-65.vercel.app
```

Если `TELEGRAM_CLIENT_ID` не задан, бэкенд попробует взять id из `TELEGRAM_BOT_TOKEN` (часть до `:`).

## После настройки

1. Redeploy backend (Render)  
2. Redeploy frontend (Vercel)  
3. На сайте появится кнопка **Sign In with Telegram**

> Важно: для popup-логина на Vercel выставлен заголовок  
> `Cross-Origin-Opener-Policy: same-origin-allow-popups` (иначе Telegram Login ломается).
