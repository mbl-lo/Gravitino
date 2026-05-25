## API авторизации

Base URL: `http://localhost:3000`

### Регистрация

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

### Вход

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

### Ошибки

| Код | Описание |
|-----|----------|
| 400 | Неверный формат данных |
| 401 | Неверный email или пароль |
| 409 | Email уже занят |