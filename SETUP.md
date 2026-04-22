# 🎓 EduTrail - Платформа для обучения школьников

## 📋 Что настроено

✅ **Mongoose + MongoDB** - база данных  
✅ **User Authentication** - регистрация и вход  
✅ **API Routes** - REST endpoints с Next.js  
✅ **React Components** - простой интерфейс  
✅ **Tailwind CSS** - стилизация  

## 🚀 Быстрый старт

### 1. Установите зависимости
```bash
npm install
```

### 2. Настройте MongoDB

**Вариант A: Локально**
```bash
# Windows: скачайте MongoDB Community Edition
# Или используйте MongoDB Atlas (облако)
```

**Вариант B: MongoDB Atlas (рекомендуется)**
1. Перейди на https://www.mongodb.com/cloud/atlas
2. Создай аккаунт и кластер
3. Скопируй Connection String
4. Обнови `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edutrail
```

### 3. Запустите разработку
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 🗂️ Структура папок

```
src/
├── components/          # React компоненты
│   ├── auth/           # Формы входа/регистрации
│   └── common/         # Header, Footer
├── controllers/        # Обработчики запросов
├── services/           # Бизнес-логика
├── models/             # Mongoose модели
├── db/                 # Конфигурация БД
├── types/              # TypeScript типы
├── utils/              # Утилиты
└── lib/                # Функции (auth, crypto)

app/
├── api/                # API маршруты
│   └── auth/          # Аутентификация
├── login/             # Страница входа
├── register/          # Страница регистрации
└── page.tsx           # Главная страница
```

## 📝 Основные файлы

### Database
- `src/db/database.ts` - подключение к MongoDB
- `src/models/user.model.ts` - схема пользователя

### Authentication
- `app/api/auth/login/route.ts` - вход
- `app/api/auth/register/route.ts` - регистрация

### Frontend
- `app/login/page.tsx` - страница входа
- `app/register/page.tsx` - страница регистрации
- `app/page.tsx` - главная страница

## 🔐 Пользователь

### Регистрация
```bash
POST /api/auth/register
Body: {
  firstName: "Иван",
  lastName: "Иванов",
  email: "ivan@example.com",
  password: "123456",
  role: "student",
  grade: 9  // для студентов
}
```

### Вход
```bash
POST /api/auth/login
Body: {
  email: "ivan@example.com",
  password: "123456"
}
```

## 🧑‍💼 Роли пользователей

- **student** - школьник (может иметь класс)
- **admin** - администратор

## 📚 Следующие шаги

### 1. Создайте модель Курса
```typescript
// src/models/course.model.ts
// Добавьте схему курса
```

### 2. Создайте эндпоинты Курсов
```typescript
// app/api/courses/route.ts
// GET /api/courses
// POST /api/courses
```

### 3. Дополните Интерфейс
```typescript
// src/components/pages/CoursesPage.tsx
// Компонент списка курсов
```

### 4. Добавьте Уроки/Тесты
```typescript
// src/models/lesson.model.ts
// src/models/test.model.ts
```

## 🛠️ Полезные команды

```bash
# Разработка
npm run dev

# Продакшн
npm run build
npm start

# Линтинг
npm run lint
```

## ⚠️ Важно!

1. **Пароли** - текущая реализация использует SHA256. В продакшене используйте bcrypt:
   ```bash
   npm install bcrypt
   ```

2. **JWT токены** - добавьте для более безопасной аутентификации:
   ```bash
   npm install jsonwebtoken
   ```

3. **Окружение** - создайте `.env.local` для переменных (MONGODB_URI и др.)

4. **CORS** - если фронтенд на другом домене, добавьте CORS middleware

## 📚 Пример: Добавление таблицы прогресса

```typescript
// src/models/progress.model.ts
const progressSchema = new Schema({
  studentId: ObjectId,
  courseId: ObjectId,
  completedLessons: [ObjectId],
  percentage: Number,
  lastAccess: Date,
});

// app/api/progress/[studentId]/route.ts
export async function GET(request, { params }) {
  const progress = await ProgressModel.findOne({
    studentId: params.studentId
  });
  return ApiResponse.success(progress);
}
```

## 📖 Документация

- [Next.js Docs](https://nextjs.org/docs)
- [Mongoose Docs](https://mongoosejs.com)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Tailwind CSS](https://tailwindcss.com)

---

**Готово к разработке! 🚀**

Начните с добавления модели курса и эндпоинтов для работы с курсами.
