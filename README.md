# EduTrail

EduTrail is a full-stack educational platform for managing subjects, courses, modules, chapters, questions, user progress and feedback. The project contains a Next.js frontend and an Express/MongoDB backend.

## What EduTrail Is For

EduTrail helps organize online learning content into a clear path: subjects contain courses, courses contain modules, modules contain chapters and questions, and students can move through that content while the system tracks their progress.

The project is useful for small educational platforms, school-style course catalogs, internal training portals, or demo projects that need authentication, admin content management, progress tracking, feedback, and image uploads in one app.

## How The Project Is Organized

The application is split into two main parts:

- The frontend in `src/` is a Next.js app. It renders public pages, student pages, admin pages, reusable UI components, and Next.js API proxy routes.
- The backend in `backend/src/` is an Express API. It owns database models, validation, authentication, business logic, file uploads, email delivery, Swagger docs, and cleanup of stored images.

Most browser requests go through `src/app/api/*` proxy routes first. Those routes forward requests to the backend API, attach auth headers/cookies where needed, and return the backend response to the UI. The backend then uses controllers for HTTP handling, services for business logic, and Mongoose models for MongoDB persistence.

## Technology Stack

Frontend:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Axios
- Vitest
- Testing Library

Backend:

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Supabase Storage
- Sharp image processing
- Nodemailer
- Swagger documentation
- Vitest and Supertest

## Project Structure

```text
.
|-- src/                         # Next.js frontend
|   |-- app/                     # App Router pages, layouts, and API proxy routes
|   |-- components/              # Reusable UI components and shared navigation
|   |-- constants/               # Frontend constants used across pages
|   |-- hooks/                   # React hooks such as authentication state
|   |-- types/                   # Frontend TypeScript types
|   `-- utils/                   # Frontend helpers and API client
|-- tests/                       # Frontend tests
|-- backend/
|   |-- src/
|   |   |-- config/              # Database and Swagger configuration
|   |   |-- controllers/         # HTTP request handlers
|   |   |-- middleware/          # Authentication and rate limiting
|   |   |-- models/              # Mongoose models
|   |   |-- routes/              # Express routes
|   |   |-- services/            # Business logic, storage cleanup, email, auth helpers
|   |   `-- types/               # Backend TypeScript types
|   `-- tests/                   # Backend tests
|-- public/                      # Static frontend assets
`-- package.json                 # Frontend scripts and dependencies
```

## Core Features

- User registration, login, authentication, and password reset.
- Subject and course management through the admin interface.
- Course structure with modules, chapters, and multiple question types.
- Student course, chapter, and question progress tracking.
- Course bookmarks and status management.
- Feedback submission and admin feedback review.
- Image upload for subjects, courses, chapters, and questions.
- Automatic Supabase Storage cleanup when images are replaced or entities are deleted.

## Environment Configuration

Create the frontend environment file:

```cmd
copy .env.example .env.local
```

Required frontend variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Create the backend environment file:

```cmd
copy backend\.env.example backend\.env.local
```

Required backend variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=EduTrail
PORT=5000
NODE_ENV=development
JWT_SECRET=change_me_to_a_long_random_secret
CORS_ORIGIN=http://localhost:3000
ENABLE_API_DOCS=false
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
MAIL_FROM="EduTrail <your_email@gmail.com>"
DEFAULT_ADMIN_EMAIL=admin@test.com
DEFAULT_ADMIN_PASSWORD=12345678A!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

The backend currently loads environment variables from `backend/.env.local`.

## Installation

Install frontend dependencies:

```cmd
npm install
```

Install backend dependencies:

```cmd
cd backend
npm install
```

## Development

Start the backend API:

```cmd
cd backend
npm run dev
```

Start the frontend application in another terminal:

```cmd
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

Use Command Prompt (`cmd`) on Windows for the commands in this document.

## Build

Build the frontend:

```cmd
npm run build
```

Build the backend:

```cmd
cd backend
npm run build
```

Start production builds:

```cmd
npm run start
```

```cmd
cd backend
npm run start
```

## Testing

Run frontend tests:

```cmd
npm run test:run
```

Run backend tests:

```cmd
cd backend
npm run test:run
```

Run backend TypeScript validation:

```cmd
cd backend
npx tsc --noEmit
```

Run linting:

```cmd
npm run lint
```

```cmd
cd backend
npm run lint
```

## API Overview

Backend API base path:

```text
http://localhost:5000/api
```

Main API groups:

- `/auth` - registration, login, users, password reset, preferences.
- `/subjects` - subject CRUD.
- `/courses` - course CRUD, course content, course progress.
- `/modules` - module CRUD.
- `/chapters` - chapter CRUD and chapter progress.
- `/questions` - question CRUD and question progress.
- `/feedback` - feedback submission and administration.
- `/upload` - image upload to Supabase Storage.

The frontend also contains Next.js API proxy routes under `src/app/api`. These routes forward requests to the backend API and pass authentication headers or cookies where needed.

## Authentication

The backend supports JWT-based authentication. The frontend stores authentication state and forwards credentials to API routes. Some admin operations also pass `x-user-id` through the frontend proxy routes.

Protected backend routes use authentication middleware and role checks where required. Admin routes should be accessed only by users with the admin role.

## Image Storage

Images are uploaded through the backend upload controller and stored in the Supabase Storage `images` bucket. Uploaded files are normalized with Sharp before storage.

Supported folders:

- `subjects`
- `courses`
- `chapters`
- `questions`

Storage cleanup is handled by backend services:

- Replacing `subject_img`, `course_img`, or `question_img` deletes the previous Supabase image after the database update succeeds.
- Removing chapter markdown image references deletes the removed Supabase images after the chapter update succeeds.
- Deleting a subject, course, chapter, or question deletes related Supabase images.
- Deleting a subject also deletes related courses through the course service.
- Deleting a course also deletes related modules, chapters, questions, and progress records.

Only Supabase public image URLs from the configured `images` bucket are selected for cleanup. External image URLs are ignored.

## Data Model Summary

Main backend models:

- `User`
- `Subject`
- `Course`
- `Module`
- `Chapter`
- `Question`
- `TestQuestion`
- `ShortAnswerQuestion`
- `FillInTheBlankQuestion`
- `CourseProgress`
- `ChapterProgress`
- `QuestionProgress`
- `Feedback`

Questions use a wrapper `Question` document that points to a type-specific document through `typeId`.

## Response Format

Successful responses use the following shape:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error responses use the following shape:

```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Error details"
}
```

## Notes for Development

- Keep frontend API calls pointed at `NEXT_PUBLIC_API_URL`.
- Keep backend secrets only in `backend/.env.local`; do not commit real credentials.
- Restart the backend after changing environment variables or backend services.
- When working with Next.js, check the local Next.js documentation under `node_modules/next/dist/docs/` before relying on framework assumptions.
- Run backend tests after changes to services, controllers, authentication, storage cleanup, or progress logic.
