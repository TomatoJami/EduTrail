# EduTrail API - Примеры запросов

## 🔍 Тестирование API

Используйте Postman, Insomnia или любой REST клиент

---

## 👤 Аутентификация

### Регистрация студента

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "firstName": "Иван",
  "lastName": "Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "role": "student",
  "grade": 9
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "ivan@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "student"
  }
}
```

### Вход

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "ivan@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "student"
  }
}
```

### Регистрация учителя

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "firstName": "Мария",
  "lastName": "Петрова",
  "email": "maria@example.com",
  "password": "teacher123",
  "role": "teacher",
  "subjects": ["Математика", "Физика"]
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "email": "maria@example.com",
    "firstName": "Мария",
    "lastName": "Петрова",
    "role": "teacher"
  }
}
```

---

## 🧪 Тестирование через cURL

### Регистрация
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Иван",
    "lastName": "Иванов",
    "email": "ivan@example.com",
    "password": "password123",
    "role": "student",
    "grade": 9
  }'
```

### Вход
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan@example.com",
    "password": "password123"
  }'
```

---

## 📱 Что дальше?

После работающей аутентификации добавьте:

1. **Модель Курса** - структура курсов
2. **Модель Урока** - уроки в курсах
3. **Модель Прогресса** - отслеживание прогресса студента
4. **Модель Теста** - тесты и домашки
5. **Модель Оценки** - оценки за выполненные задания

Полный workflow:
```
Учитель создает курс
  → Добавляет уроки
    → Добавляет тесты
      → Студент проходит урок
        → Сдает тест
          → Получает оценку
```
