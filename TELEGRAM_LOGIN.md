# Официальный вход «Войти через Telegram»

Так работает **Telegram Login Widget**:

1. Пользователь жмёт кнопку на сайте  
2. Telegram показывает запрос на имя / username / фото  
3. Пользователь подтверждает вход в приложении Telegram («Принять»)  
4. Сайт получает данные и создаёт сессию  

Это **невозможно без бота** — так устроен Telegram.

## Настройка (один раз)

### 1. Создать бота
1. Откройте [@BotFather](https://t.me/BotFather)
2. `/newbot` → задайте имя и username (например `GroupAwardsBot`)
3. Сохраните **token**

### 2. Привязать домен сайта
В BotFather:
`Bot Settings` → `Domain` → укажите домен фронта **без** `https://`:

```text
frontend-eight-eosin-65.vercel.app
```

### 3. Env на Render (бэкенд)

| Variable | Значение |
|----------|----------|
| `TELEGRAM_BOT_TOKEN` | токен от BotFather |
| `TELEGRAM_BOT_USERNAME` | username бота **без** `@` (например `GroupAwardsBot`) |
| `TELEGRAM_LITE_AUTH` | `false` (или не задавать) |

### 4. Redeploy
Перезапустите Web Service на Render. На лендинге появится официальная кнопка Telegram Login.
