# Деплой бэкенда на Render

## Что понадобится

1. Аккаунт на [render.com](https://render.com)
2. Репозиторий с папкой `group-awards/backend` (и `Dockerfile` внутри)
3. PostgreSQL (удобно создать на том же Render)

---

## Шаг 1. PostgreSQL на Render

1. **Dashboard → New → PostgreSQL**
2. Имя: `group-awards-db` (любое)
3. Region ближе к вам (например Frankfurt)
4. Создайте и дождитесь Ready
5. Откройте БД → **Connections** и скопируйте:
   - **Internal Database URL** (если веб-сервис в том же аккаунте Render)  
   - или **External Database URL**

Render даёт URL вида:

```text
postgres://USER:PASSWORD@HOST:5432/DBNAME
```

Spring ждёт JDBC:

```text
jdbc:postgresql://HOST:5432/DBNAME
```

Разберите URL вручную:

| Часть URL | Куда |
|-----------|------|
| `USER` | `SPRING_DATASOURCE_USERNAME` |
| `PASSWORD` | `SPRING_DATASOURCE_PASSWORD` |
| `HOST:5432/DBNAME` | `SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/DBNAME` |

---

## Шаг 2. Web Service (бэкенд)

1. **New → Web Service**
2. Подключите Git-репозиторий
3. Настройки:
   - **Root Directory:** `group-awards/backend`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile` (относительно root directory)
   - **Instance type:** Free / Starter

### Environment Variables (обязательные)

| Key | Пример / значение | Зачем |
|-----|-------------------|--------|
| `JWT_SECRET` | длинная случайная строка ≥ 32 символов | подпись JWT |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://dpg-xxx:5432/group_awards` | БД |
| `SPRING_DATASOURCE_USERNAME` | из Render Postgres | логин БД |
| `SPRING_DATASOURCE_PASSWORD` | из Render Postgres | пароль БД |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | разрешённые фронты (через запятую, без пробелов или с пробелами — лучше без) |

### Environment Variables (опциональные)

| Key | По умолчанию | Зачем |
|-----|--------------|--------|
| `TELEGRAM_LITE_AUTH` | `true` | вход кнопкой без бота (username + имя) |
| `TELEGRAM_BOT_TOKEN` | не задавать | только если хотите официальный Login Widget |
| `TELEGRAM_BOT_USERNAME` | не задавать | имя бота без `@` для виджета |
| `PORT` | Render выставляет сам | слушает `${PORT:8080}` |

> На Free-плане сервис «засыпает». Первый запрос после паузы может идти 30–60 секунд — фронт покажет экран **RADIO SILENCE**, затем нужно нажать «Повторить».

---

## Шаг 3. Проверка API

После деплоя откройте:

```text
https://YOUR-SERVICE.onrender.com/api/public/health
```

Ожидается: `{"status":"ok"}`

Админ после первого старта: логин `admin`, пароль `admin` → сразу смена пароля.

---

## Шаг 4. Фронтенд

При сборке фронта задайте URL бэкенда:

```bash
# .env.production во frontend
VITE_API_URL=https://YOUR-SERVICE.onrender.com
```

И в бэкенде в `CORS_ORIGINS` укажите URL фронта (Vercel / Netlify / другой хост).

Локально `VITE_API_URL` не нужен — Vite проксирует `/api` на `localhost:8080`.

---

## Вход без бота

Официальный Telegram Login Widget **требует бота**.  
В приложении по умолчанию включён **lite-режим**: кнопка «Войти через Telegram» → username + имя, без BotFather.

Чтобы включить настоящий виджет:

1. Создайте бота у @BotFather  
2. В BotFather → Bot Settings → Domain — домен фронта  
3. На Render задайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_BOT_USERNAME`  
4. Можно выключить lite: `TELEGRAM_LITE_AUTH=false`

---

## Частые проблемы

- **CORS error** — нет URL фронта в `CORS_ORIGINS`
- **502 / sleeping** — cold start Free-инстанса, подождите и обновите
- **DB connection failed** — неверный JDBC URL (нужен префикс `jdbc:postgresql://`, не `postgres://`)
- **Invalid JWT** — сменили `JWT_SECRET` → всем нужно войти заново
