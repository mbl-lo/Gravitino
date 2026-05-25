# Gravitino

Прототип веб-приложения "Цифровой архив путевых листов".

## Стек

- Frontend: React + Vite + TypeScript.
- Backend: NestJS + TypeScript.
- БД: PostgreSQL.
- ORM: Prisma.

## Локальная подготовка

```bash
cd backend
npm install

cd ../frontend
npm install
```

На Windows, если PowerShell блокирует `npm.ps1`, используйте `npm.cmd install`.

## Переменные окружения

Пример общих переменных находится в `.env.example`, пример backend-переменных — в `backend/.env.example`.

Для локального ноутбука создан файл `backend/.env`:

```env
DATABASE_URL=postgresql://postgres@localhost:5433/waybill?schema=public
JWT_SECRET=local-dev-secret
PORT=3000
```

Если у другого разработчика PostgreSQL установлен стандартно, обычно подойдет:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/waybill?schema=public
```

## База данных

Схема описана в `backend/prisma/schema.prisma` и соответствует ERD проекта:

- `organizations`, `departments`, `users`;
- `drivers`, `vehicles`;
- `documents`, `document_fields`, `document_history`;
- `validation_rules`, `anomalies`;
- `processing_jobs`, `integration_configs`, `export_jobs`, `audit_logs`.

### Создание БД и миграции

```bash
createdb waybill
cd backend
npm run db:migrate -- --name init_waybill_schema
npm run db:generate
```

Если `createdb` не добавлен в `PATH`, укажите полный путь к утилите PostgreSQL.

На текущем ноутбуке PostgreSQL найден здесь:

```powershell
& "C:\Program Files\ASCON\KOMPAS-3D v24\Libs\PolynomLib\Templates\LocalBase\bin\createdb.exe" -h localhost -p 5433 -U postgres waybill
```

### Тестовые данные

После миграций можно загрузить тестовые данные:

```bash
psql "$DATABASE_URL" -f ../database/seed.sql
```

Для текущего ноутбука:

```powershell
& "C:\Program Files\ASCON\KOMPAS-3D v24\Libs\PolynomLib\Templates\LocalBase\bin\psql.exe" -h localhost -p 5433 -U postgres -d waybill -f ..\database\seed.sql
```

Тестовый пользователь:

- email: `admin@gravitino.local`
- пароль: `password123`

Проверить состояние миграций:

```bash
cd backend
npm run db:status
```

## Импорт дампа БД

Дамп лежит в `database/waybill_dump.sql`.

Чтобы импортировать дамп в чистую локальную БД:

```bash
createdb waybill
psql -d waybill -f database/waybill_dump.sql
```

Если база уже существует и ее нужно пересоздать:

```bash
dropdb waybill
createdb waybill
psql -d waybill -f database/waybill_dump.sql
```

На Windows можно использовать полный путь к `psql.exe`, если PostgreSQL не добавлен в `PATH`.

## Запуск на ноутбуке (Windows)

### 1. PostgreSQL

Убедитесь, что PostgreSQL запущен на порту из `backend/.env` (сейчас `5433`).

Проверка:

```powershell
& "C:\Program Files\ASCON\KOMPAS-3D v24\Libs\PolynomLib\Templates\LocalBase\bin\psql.exe" -h localhost -p 5433 -U postgres -d waybill -c "SELECT 1;"
```

Если база пустая или нужно обновить тестовые данные:

```powershell
cd backend
& "C:\Program Files\ASCON\KOMPAS-3D v24\Libs\PolynomLib\Templates\LocalBase\bin\psql.exe" -h localhost -p 5433 -U postgres -d waybill -f ..\database\seed.sql
```

### 2. Backend API

```powershell
cd backend
npm.cmd install
npm.cmd run db:generate
npm.cmd run start:dev
```

Проверка:

- `http://localhost:3000/health` — статус БД и счётчики таблиц
- `POST http://localhost:3000/auth/login` — вход (см. тестового пользователя ниже)
- `GET http://localhost:3000/auth/me` — профиль (нужен заголовок `Authorization: Bearer <token>`)

Пример входа в PowerShell:

```powershell
$body = '{"email":"admin@gravitino.local","password":"password123"}'
Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -ContentType "application/json" -Body $body
```

### 3. Frontend (шаблон Vite, пока без экранов прототипа)

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Откройте адрес из консоли Vite (обычно `http://localhost:5173`).

Полный UI как на [прототипе](https://6.site-test123.ru/) — задача этапа 4 (frontend).
