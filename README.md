## Работа с API

### Загрузка путевого листа (документа)
**Эндпоинт:** `POST /documents/upload`

**Формат запроса:** `multipart/form-data`

**Параметры (form-data):**
- `file` *(обязательный)*: Файл путевого листа (форматы: .jpg, .png, .pdf, .heic).
- `description` *(необязательный)*: Текстовое описание к загружаемому файлу.

**Пример успешного ответа:**
```json
{
    "message": "Файл успешно загружен",
    "document": {
        "id": 1779722907348,
        "filename": "1779722907334-93392284.JPG",
        "originalname": "_MG_9210.JPG",
        "path": "uploads\\1779722907334-93392284.JPG",
        "size": 2799749,
        "status": "Ожидает обработки",
        "uploadedAt": "2026-05-25T15:28:27.348Z"
    }
}
```

### API авторизации

Base URL: `http://localhost:3000`

#### Регистрация

**POST** `/auth/register`

Request body:
```json
{
  "name": "Vadim",
  "email": "vadim@example.com",
  "password": "123456"
}
```

Response:
```json
{
  "message": "register stub",
  "email": "vadim@example.com"
}
```

#### Вход

**POST** `/auth/login`

Request body:
```json
{
  "email": "vadim@example.com",
  "password": "123456"
}
```

Response:
```json
{
  "message": "login stub",
  "email": "vadim@example.com"
}
```

#### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Неверный формат данных |
| 401 | Неверный email или пароль |
| 409 | Email уже занят |