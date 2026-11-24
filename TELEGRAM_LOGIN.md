# Авторизация через Telegram на сайте

Используется официальный **Telegram Login Widget**.

## Что нужно на Render

```text
TELEGRAM_BOT_TOKEN=123456:AAH...
TELEGRAM_BOT_USERNAME=YourBotName
CORS_ORIGINS=https://frontend-eight-eosin-65.vercel.app
```

## BotFather

1. `/newbot` — создать бота  
2. `/setdomain` → `frontend-eight-eosin-65.vercel.app` (без https)  
3. Redeploy бэкенда  

## Как входит пользователь

1. Открывает сайт  
2. Жмёт официальную кнопку Telegram Login  
3. Подтверждает вход  
4. Попадает в голосование  

Если виджет не открывается — на сайте есть запасной вход по `@username`.
