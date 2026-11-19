# Group Awards (F1)

Веб-приложение премии группы: голосование через Telegram, админка с номинациями, ничьими и PDF-отчётами.

## Стек

- Frontend: React + TypeScript + Vite + Framer Motion
- Backend: Java 21 + Spring Boot 3 + Spring Security (JWT)
- DB: PostgreSQL 16

## Быстрый старт

### 1. PostgreSQL

Запустите Docker Desktop, затем:

```bash
cd group-awards
docker compose up -d
```

БД: `group_awards` / user `awards` / password `awards_secret` (порт `5432`).

### 2. Telegram-бот

1. Создайте бота у [@BotFather](https://t.me/BotFather).
2. В настройках бота укажите домен для Login Widget (для локальной разработки — через туннель или localhost, если Telegram это принимает).
3. Задайте переменные окружения перед запуском бэкенда:

```powershell
$env:TELEGRAM_BOT_TOKEN="123456:ABC..."
$env:TELEGRAM_BOT_USERNAME="YourBotName"
$env:JWT_SECRET="please-change-me-to-a-long-random-secret-key"
```

### 3. Backend

```bash
cd group-awards/backend
mvn spring-boot:run
```

API: `http://localhost:8080`

При первом запуске создаётся админ: логин `admin`, пароль `admin` (обязательная смена после входа). Пароль хранится как BCrypt.

### 4. Frontend

```bash
cd group-awards/frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

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
