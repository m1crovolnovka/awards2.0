# Group Awards (F1)

Веб-приложение премии группы: голосование через Telegram, админка с номинациями, ничьими и PDF-отчётами.

## Стек

- Frontend: React + TypeScript + Vite + Framer Motion
- Backend: Java 21 + Spring Boot 3 + Spring Security (JWT)
- DB: PostgreSQL 16

## Вход через Telegram

- **Без бота (по умолчанию):** кнопка «Войти через Telegram» → `@username` + имя. Аккаунт стабилен по username.
- **С ботом (официальный виджет):** задайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_BOT_USERNAME`. Официальный Login Widget без бота сделать нельзя — так устроен Telegram.

## Быстрый старт

### 1. PostgreSQL

```bash
cd group-awards
docker compose up -d
```

БД: `group_awards` / user `awards` / password `awards_secret` (порт `5432`).

### 2. Backend

```bash
cd group-awards/backend
mvn spring-boot:run
```

API: `http://localhost:8080`  
Админ при первом запуске: `admin` / `admin` (BCrypt, сразу смена пароля).

### 3. Frontend

```bash
cd group-awards/frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

## Деплой на Render

Подробная инструкция и список env: см. [DEPLOY_RENDER.md](./DEPLOY_RENDER.md).

## Роли

| Роль | Вход | Возможности |
|------|------|-------------|
| USER | Telegram Login Widget | Голосование (1 номинант на номинацию) |
| ADMIN | логин/пароль | CRUD номинаций/номинантов, статистика, завершение голосования, ничьи, PDF |

Пользователи не имеют доступа к `/admin` и `/api/admin/**` (JWT + `ROLE_ADMIN`).

## Поведение голосования

- Номинации — в порядке добавления.
- Номинанты в номинации — по алфавиту.
- После «Завершить голосование» пользователи видят экран **СКОРО** с таймером объявления.
- Админ видит число голосов по номинации; детализация по номинантам — только после завершения.
- Ничья (равное число голосов у лидеров) → красный `!` → админ выбирает победителя.
- Отчёты PDF:
  - победители (имя для отчёта на отдельной странице номинации);
  - детальный (голоса по каждому номинанту).

## Картинки

Загружаются multipart и сохраняются в PostgreSQL как `BYTEA`.
