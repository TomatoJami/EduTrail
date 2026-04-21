# 📸 Способы хранения картинок в приложении

## Сравнение методов

| Способ | Плюсы | Минусы | Для кого |
|--------|-------|--------|---------|
| **CloudStorage (Firebase, AWS S3)** | Масштабируемость, CDN, надежность | Платно ($) при больших объемах | Production |
| **Cloudinary/Imgur API** | Простая интеграция, автоматическое сжатие | Зависимость от сервиса, лимиты | Быстрый старт |
| **BufferStore в MongoDB** | Всё в одной БД, просто | Медленно, занимает место в БД | Маленькие файлы |
| **File System (локальный диск)** | Быстро, бесплатно | Не масштабируется, нужна резервная копия | Разработка |
| **CDN + API** | Комбинированный подход | Сложнее настраивать | Оптимальный вариант |

---

## 🔥 Рекомендуемый способ: Cloudinary (Самый простой и быстрый)

### 1️⃣ Установка
```bash
npm install next-cloudinary
```

### 2️⃣ Создайте аккаунт на https://cloudinary.com

### 3️⃣ Обновите `.env.local`
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4️⃣ Компонент загрузки картинки
```typescript
// src/components/common/ImageUpload.tsx
"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useState } from "react";

export function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string>("");

  return (
    <div>
      <CldUploadWidget
        uploadPreset="your_upload_preset" // Создайте в Cloudinary
        onSuccess={(result: any) => {
          const url = result.info.secure_url;
          setPreview(url);
          onUpload(url);
        }}
      >
        {({ open }) => (
          <button
            onClick={() => open()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Загрузить фото
          </button>
        )}
      </CldUploadWidget>

      {preview && (
        <Image
          src={preview}
          alt="Preview"
          width={200}
          height={200}
          className="mt-4 rounded"
        />
      )}
    </div>
  );
}
```

### 5️⃣ Использование в форме
```typescript
// В RegisterForm:
const handleImageUpload = (url: string) => {
  setFormData(prev => ({ ...prev, user_img: url }));
};

// В форме:
<ImageUpload onUpload={handleImageUpload} />
```

---

## 🟦 Альтернатива: AWS S3 (Профессиональный вариант)

### Плюсы:
- Масштабируемость
- Дешево при малых объемах
- Интеграция с AWS CDN

### Способ установки:
```bash
npm install aws-sdk
```

```typescript
// src/lib/s3.ts
import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function uploadToS3(file: Buffer, fileName: string) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `avatars/${fileName}`,
    Body: file,
    ContentType: "image/jpeg",
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}
```

---

## 📁 Локальное хранилище (для разработки)

### Просто и быстро для тестирования:

```typescript
// src/lib/uploadLocal.ts
import fs from "fs";
import path from "path";

export async function saveImageLocally(
  file: File,
  userId: string
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const filename = `${userId}-${Date.now()}.jpg`;
  const filepath = path.join(process.cwd(), "public/uploads", filename);

  fs.writeFileSync(filepath, Buffer.from(buffer));
  return `/uploads/${filename}`;
}
```

```typescript
// app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  const url = await saveImageLocally(file, userId);
  return ApiResponse.success({ url });
}
```

---

## 🎯 Для вашего проекта (Рекомендация)

### Этап 1: Разработка
```
Используйте Cloudinary (бесплатный план → 25 GB/мес)
```

### Этап 2: Production
```
Мигрируйте на AWS S3 или Firebase Storage
```

### Кода для быстрого старта:

``.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
```

---

## 🚀 Быстрый старт с Cloudinary

1. Зарегистрируйтесь: https://cloudinary.com/users/register/free
2. Скопируйте Cloud Name из Dashboard
3. Создайте Upload Preset (Settings → Upload)
4. Установите пакет:
   ```bash
   npm install next-cloudinary
   ```
5. Используйте компонент выше

---

## 💾 Где хранить URL картинок?

В MongoDB в поле `user_img` (уже добавлено):

```typescript
// user_img может быть:
// - URL от Cloudinary: "https://res.cloudinary.com/.../image.jpg"
// - URL от S3: "https://mybucket.s3.amazonaws.com/.../image.jpg"
// - Локальный путь: "/uploads/user-123.jpg"

// Пример сохранения:
const user = await UserModel.create({
  email: "ivan@example.com",
  password: hashedPassword,
  name: "Ivan Ivanov",
  role: "student",
  user_img: "https://res.cloudinary.com/.../avatar.jpg", // ✅ Сохраняем URL
});
```

---

## 📤 Интеграция в RegisterForm

```typescript
// Добавьте в форму:
import { ImageUpload } from "@/components/common/ImageUpload";

// В форме:
const [userImg, setUserImg] = useState("");

<ImageUpload onUpload={setUserImg} />

// При отправке:
body: JSON.stringify({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  user_img: userImg,
  // ...
});
```

---

## 🔒 Безопасность

⚠️ **Важно:**
- Валидируйте размер файла (макс. 5MB)
- Проверяйте MIME type (только изображения)
- Используйте CORS настройки
- Шифруйте ключи в `.env.local`

---

**Вывод:** Для быстрого старта используйте **Cloudinary**, позже мигрируйте на **S3**.
