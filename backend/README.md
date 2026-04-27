# 🚀 EduTrail Backend API

Express.js сервер для EduTrail платформы обучения.

## 📋 Требования

- Node.js 16+
- npm или yarn
- MongoDB (локально или MongoDB Atlas)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Конфигурация

Скопируй `.env.example` в `.env` и обнови переменные:

```bash
cp .env.example .env
```

**Переменные окружения:**
- `MONGODB_URI` - Connection string MongoDB
- `PORT` - Порт сервера (по умолчанию 5000)
- `NODE_ENV` - Окружение (development/production)
- `JWT_SECRET` - Секретный ключ для JWT
- `CORS_ORIGIN` - URL фронтенда (по умолчанию http://localhost:3000)

### 3. Запуск

**Development (с автоматической перезагрузкой):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📡 API Структура

### Endpoints

#### Auth Routes (`/api/auth`)
```
POST   /signup          - Регистрация нового пользователя
POST   /login           - Вход в систему
GET    /                - Получить всех пользователей
GET    /:id             - Получить пользователя по ID
```

#### Courses Routes (`/api/courses`)
```
GET    /                - Получить все курсы
GET    /:id             - Получить курс по ID
POST   /                - Создать курс (требует админ)
PUT    /:id             - Обновить курс (требует админ)
DELETE /:id             - Удалить курс (требует админ)
```

#### Subjects Routes (`/api/subjects`)
```
GET    /                - Получить все предметы
GET    /:id             - Получить предмет по ID
POST   /                - Создать предмет (требует админ)
PUT    /:id             - Обновить предмет (требует админ)
DELETE /:id             - Удалить предмет (требует админ)
```

## 🔐 Аутентификация

Используется простая система на основе `x-user-id` заголовка:

```javascript
// Запрос с аутентификацией
fetch('http://localhost:5000/api/courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'mongo_user_id',
  },
  body: JSON.stringify({...})
})
```

## 📁 Структура проекта

```
src/
├── server.ts              # Главный файл, инициализация Express
├── controllers/           # Обработчики HTTP запросов
│   ├── userController.ts
│   ├── courseController.ts
│   └── subjectController.ts
├── services/              # Бизнес-логика
│   ├── userService.ts
│   ├── courseService.ts
│   └── subjectService.ts
├── models/                # MongoDB модели (Mongoose schemas)
│   ├── User.ts
│   ├── Course.ts
│   └── Subject.ts
├── routes/                # API маршруты
│   ├── userRoutes.ts
│   ├── courseRoutes.ts
│   └── subjectRoutes.ts
├── middleware/            # Express middleware
│   └── authMiddleware.ts   # Auth, admin check, logging, error handling
├── config/                # Конфигурация
│   └── database.ts        # MongoDB подключение
└── types/                 # TypeScript интерфейсы
    └── index.ts
```

## 🔄 Архитектура

### Слои приложения

1. **Routes** - Определяют HTTP endpoints
2. **Middleware** - Проверка прав, логирование, обработка ошибок
3. **Controllers** - Парсинг запроса, валидация, координация
4. **Services** - Бизнес-логика, работа с БД
5. **Models** - Определение структуры данных (Mongoose)

### Flow запроса

```
HTTP Request
    ↓
Router (выбирает маршрут)
    ↓
Middleware (auth, logging)
    ↓
Controller (парсинг, валидация)
    ↓
Service (бизнес-логика, БД)
    ↓
Response
```

## 📦 Зависимости

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables
- **express-async-errors** - Async error handling

## 🛠️ Разработка

### Структура ответа

Все endpoints возвращают JSON в формате:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* данные */ }
}
```

Или при ошибке:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

### Добавление нового endpoint

1. Создай маршрут в `/routes`
2. Создай контроллер в `/controllers`
3. Создай сервис в `/services` (если нужна бизнес-логика)
4. Подключи в `server.ts`

Пример:

```typescript
// routes/exampleRoutes.ts
import { Router } from 'express';
import { exampleController } from '@/controllers/exampleController';

const router = Router();
router.get('/', (req, res) => exampleController.getAll(req, res));
export default router;

// server.ts
app.use('/api/example', exampleRoutes);
```

## 🚀 Деплой

### Heroku
```bash
# Убедись что есть Procfile
echo "web: npm start" > Procfile

# Деплой
heroku create
git push heroku main
```

### Docker
```bash
# Создай Dockerfile
docker build -t edutrail-backend .

# Запусти
docker run -p 5000:5000 edutrail-backend
```

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Проверь, что MongoDB запущена
- Убедись что MONGODB_URI правильный
- Проверь сетевые настройки (особенно для MongoDB Atlas)

**CORS Errors**
- Убедись что CORS_ORIGIN в .env совпадает с URL фронтенда
- Проверь заголовки запроса

**Port Already in Use**
```bash
# Найди процесс на порту 5000
lsof -i :5000

# Убей процесс
kill -9 <PID>
```

## 📚 Дополнительные ресурсы

- [Express Documentation](https://expressjs.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
