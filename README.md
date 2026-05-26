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

Для локального запуска создайте файл `backend/.env`:

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

### Тестовые данные

После миграций можно загрузить тестовые данные:

```bash
psql "$DATABASE_URL" -f ../database/seed.sql
```

Тестовый пользователь:

- email: `admin@gravitino.local`
- пароль: `password123`

## Импорт дампа БД

Дамп лежит в `database/waybill_dump.sql`.

```bash
createdb waybill
psql -d waybill -f database/waybill_dump.sql
```

## Запуск backend

```bash
cd backend
npm install
npm run db:generate
npm run start:dev
```

## Работа с API

Base URL: `http://localhost:3000`

### Авторизация

**POST** `/auth/login`

Request body:
```json
{
  "email": "admin@gravitino.local",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "admin@gravitino.local",
    "fullName": "...",
    "role": "operator"
  }
}
```

**GET** `/auth/me` — требует заголовок `Authorization: Bearer <token>`

### Загрузка путевого листа (документа)

**POST** `/documents/upload` — `multipart/form-data`

Параметры:
- `file` *(обязательный)*: файл (.jpg, .png, .pdf, .heic)
- `description` *(необязательный)*: описание

Пример успешного ответа:
```json
{
  "message": "Файл успешно загружен",
  "document": {
    "id": 1779722907348,
    "filename": "1779722907334-93392284.JPG",
    "originalname": "_MG_9210.JPG",
    "path": "uploads/1779722907334-93392284.JPG",
    "size": 2799749,
    "status": "Ожидает обработки",
    "uploadedAt": "2026-05-25T15:28:27.348Z"
  }
}
```

### Mock OCR обработка документа

**POST** `/documents/:id/ocr`

Запускает mock OCR для документа по его id. Возвращает распознанные данные путевого листа.

Пример ответа:
```json
{
  "document_id": "PL-2026-00127",
  "date": "2026-05-26",
  "organization": "ООО 'Транс Логистик'",
  "driver": { "name": "Сидоров Дмитрий Михайлович", "employee_number": "00245" },
  "vehicle": { "model": "Hyundai Solaris", "license_plate": "С789МР" },
  "mileage": { "odometer_start": 45672, "odometer_end": 45856, "calculated": 184 },
  "fuel": { "start_balance": 42, "issued": 20, "end_balance": 31, "deviation_percent": 18 },
  "anomalies": [{ "type": "fuel_overconsumption", "severity": "high" }]
}
```

### Список документов

**GET** `/documents`

### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Неверный формат данных |
| 401 | Неверный email или пароль |
| 409 | Email уже занят |
