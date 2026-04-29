# Preferences Page Implementation - Complete Documentation

## 📋 Overview

Реализована полная система онбоардинга для новых пользователей с выбором интересующих предметов и уровня образования. Страница доступна **ТОЛЬКО** сразу после успешной регистрации и больше никогда.

## ✅ Что было реализовано

### 1. Backend (Node.js/Express)

#### 📝 Модель пользователя (`backend/src/models/User.ts`)
- **`ageGroup`**: '1-3' | '4-9' | '10-12' - уровень образования
- **`preferredSubjects`**: ObjectId[] - выбранные предметы
- **`hasCompletedOnboarding`**: boolean - флаг завершения онбоардинга

#### 🔧 User Service (`backend/src/services/userService.ts`)
```typescript
// Сохранить предпочтения
savePreferences(userId, preferredSubjects, ageGroup)

// Пропустить предпочтения
skipPreferences(userId)
```

#### 🎮 User Controller (`backend/src/controllers/userController.ts`)
```typescript
// POST /api/users/:id/preferences
async savePreferences(req, res)

// POST /api/users/:id/preferences/skip
async skipPreferences(req, res)
```

#### 🛣️ Routes (`backend/src/routes/userRoutes.ts`)
```
POST /api/users/:id/preferences
POST /api/users/:id/preferences/skip
```

### 2. Frontend (Next.js)

#### 📄 Обновленная страница регистрации (`src/app/(pages)/signup/page.tsx`)
- После успешной регистрации сохраняет данные пользователя в `sessionStorage`
- Автоматический редирект на `/preferences` вместо `/login`

#### 🎨 Новая страница предпочтений (`src/app/(pages)/preferences/page.tsx`)
- **Защита**: проверка `sessionStorage` на наличие `newUserData`
- **Интерфейс**:
  - Левая колонка: список всех предметов (checkboxes)
  - Правая колонка: выбор уровня образования (radio buttons)
  - Кнопка "Continue" для сохранения
  - Кнопка "Skip" для пропуска
- **Безопасность**: 
  - Если нет `newUserData` в sessionStorage → редирект на `/login`
  - После сохранения/пропуска → очистка sessionStorage
  - Другие пользователи не могут получить доступ к этой странице

#### 🌐 API Proxy Routes (Next.js)
- `src/app/api/users/[id]/preferences/route.ts` - POST handler
- `src/app/api/users/[id]/preferences/skip/route.ts` - POST handler

### 3. Типы (`backend/src/types/index.ts`)
Обновлены типы User interface с новыми полями:
```typescript
ageGroup?: '1-3' | '4-9' | '10-12'
preferredSubjects?: string[]
hasCompletedOnboarding?: boolean
```

## 🔐 Безопасность

### Защита от несанкционированного доступа
1. **sessionStorage проверка** - страница недоступна без наличия `newUserData`
2. **Одноразовый доступ** - данные удаляются после использования
3. **hasCompletedOnboarding флаг** - даже если пользователь заново откроет страницу, он не сможет получить доступ

### Поток безопасности
```
Регистрация → sessionStorage + redirect → /preferences
                                            ↓
                                    Проверка sessionStorage
                                    ↓ (если есть)
                                    Загрузка предметов
                                    ↓
                                    Continue/Skip
                                    ↓
                                    Очистка sessionStorage
                                    ↓
                                    Редирект на /
```

## 📊 Данные в БД после завершения

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "ageGroup": "4-9",
  "preferredSubjects": ["subject_id_1", "subject_id_2"],
  "hasCompletedOnboarding": true,
  "wishlistSubjects": [],
  "createdAt": "2026-04-29T...",
  "updatedAt": "2026-04-29T..."
}
```

## 🧪 Тестирование

### 1. Регистрация
```bash
curl -X POST http://localhost:5000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Сохранение предпочтений
```bash
curl -X POST http://localhost:5000/api/users/{userId}/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferredSubjects": ["subject_id_1", "subject_id_2"],
    "ageGroup": "4-9"
  }'
```

### 3. Пропуск предпочтений
```bash
curl -X POST http://localhost:5000/api/users/{userId}/preferences/skip \
  -H "Content-Type: application/json"
```

## 🚀 Как это работает для пользователя

1. **Пользователь регистрируется** на странице `/signup`
2. **После успешной регистрации** автоматически видит меню выбора предмет + уровень образования
3. **Пользователь выбирает**:
   - Интересующие предметы (может выбрать несколько)
   - Уровень образования (1-3, 4-9, 10-12)
4. **Нажимает Continue** (или Skip, если не хочет выбирать)
5. **Данные сохраняются** в БД
6. **Редирект на главную страницу** `/`

## ⚙️ Переменные окружения

Убедитесь, что у вас есть:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 Файлы которые были изменены/созданы

### Создано:
- `src/app/(pages)/preferences/page.tsx` - Страница выбора предпочтений
- `src/app/api/users/[id]/preferences/route.ts` - API для сохранения предпочтений
- `src/app/api/users/[id]/preferences/skip/route.ts` - API для пропуска
- `PREFERENCES_TESTING.md` - Документ с примерами тестирования

### Обновлено:
- `src/app/(pages)/signup/page.tsx` - Добавлен редирект на preferences
- `backend/src/models/User.ts` - Добавлены новые поля
- `backend/src/services/userService.ts` - Добавлены новые методы
- `backend/src/controllers/userController.ts` - Добавлены новые handlers
- `backend/src/routes/userRoutes.ts` - Добавлены новые роуты
- `backend/src/types/index.ts` - Обновлены типы

## 🎯 Дополнительные возможности

Если потребуется расширение функциональности:

1. **Добавить валидацию предпочтений** - проверить, что выбранные subjects существуют
2. **Отправить email** - уведомить пользователя о завершении регистрации
3. **Рекомендации** - показать курсы на основе выбранных предметов
4. **Аналитика** - отслеживать какие предметы выбирают чаще всего
