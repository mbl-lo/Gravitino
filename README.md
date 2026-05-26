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
- `uploadedById` *(обязательный)*: id пользователя

Пример успешного ответа:
```json
{
    "id": "f7a46c2a-87b3-4f92-90aa-0ab80113f98c",
    "uploadedById": "33333333-3333-4333-8333-333333333334",
    "driverId": null,
    "vehicleId": null,
    "documentNumber": null,
    "tripDate": null,
    "originalFileUrl": "uploads\\1779809682333-288146754.JPG",
    "originalFileName": "_MG_9210.JPG",
    "fileMimeType": "image/jpeg",
    "fileSize": 2799749,
    "status": "uploaded",
    "ocrStatus": "pending",
    "ocrConfidence": null,
    "hasAnomalies": false,
    "confirmedAt": null,
    "confirmedById": null,
    "createdAt": "2026-05-26T15:34:42.356Z",
    "updatedAt": "2026-05-26T15:34:42.356Z"
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
### Получение списка пользователей
**GET** `/users`

Пример успешного ответа:
```json
[
  {
    "id": "clw7y2z1a0000tr98x7v1p9l2",
    "email": "operator.ivanov@company.ru",
    "name": "Иванов Иван Иванович",
    "role": "OPERATOR",
    "isActive": true,
    "createdAt": "2026-05-26T10:00:00.000Z"
  },
  ...
]
```

### Создание нового пользователя
**POST** `/users` — `application/json`

Параметры:

- `email` *(обязательный)*: строка
- `password` *(обязательный)*: строка
- `name` *(обязательный)*: строка
- `role` *(обязательный)*: строка

Пример успешного ответа:
```json
{
  "id": "clw8z3m2b0001tr98x7v2q0m3",
  "email": "demo@company.ru",
  "name": "Алексеева Анна Сергеевна",
  "role": "OPERATOR",
  "organizationId": "uuid",
  "createdAt": "2026-05-26T15:20:00.000Z"
}
```

### Просмотр / Скачивание бинарного файла документа
**GET** `/documents/:id/file`

Параметры:

- `id` *(обязательный)*: UUID документа в базе данных

Пример успешного ответа:
Бинарный поток файла

### Получение списка документов
**GET** `/documents` — `application/json`

Пример успешного ответа:
```json
[
    {
        "id": "1c3f1904-aff7-4356-acef-8fc045417b84",
        "uploadedById": "33333333-3333-4333-8333-333333333334",
        "driverId": null,
        "vehicleId": null,
        "documentNumber": null,
        "tripDate": null,
        "originalFileUrl": "uploads\\1779809822931-908928842.JPG",
        "originalFileName": "_MG_9210.JPG",
        "fileMimeType": "image/jpeg",
        "fileSize": 2799749,
        "status": "uploaded",
        "ocrStatus": "pending",
        "ocrConfidence": null,
        "hasAnomalies": false,
        "confirmedAt": null,
        "confirmedById": null,
        "createdAt": "2026-05-26T15:37:02.957Z",
        "updatedAt": "2026-05-26T15:37:02.957Z"
    },
    ...
]
```

### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Неверный формат данных |
| 401 | Неверный email или пароль |
| 409 | Email уже занят |
