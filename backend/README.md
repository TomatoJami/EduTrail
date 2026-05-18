# EduTrail Backend API

EduTrail Backend API is the Express and MongoDB service for the EduTrail learning platform. It provides authentication, administration, course content management, progress tracking, feedback, email delivery, image upload, and Supabase Storage cleanup.

## Technology Stack

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Supabase Storage
- Sharp image processing
- Nodemailer
- Swagger UI
- Vitest
- Supertest

## Requirements

- Node.js 20 or newer is recommended.
- npm
- MongoDB or MongoDB Atlas
- Supabase project with a Storage bucket named `images`
- SMTP credentials for password reset email delivery

## Installation

From the `backend` directory:

```cmd
npm install
```

## Environment Configuration

Copy the example environment file:

```cmd
copy .env.example .env.local
```

The backend loads environment variables from `backend/.env.local`.

Required variables:

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
DEFAULT_ADMIN_EMAIL=admin@edutrail.local
DEFAULT_ADMIN_PASSWORD=12345678A!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Variable notes:

- `MONGODB_URI` connects the API to MongoDB.
- `JWT_SECRET` signs authentication tokens.
- `CORS_ORIGIN` must match the frontend origin.
- `FRONTEND_URL` is used when generating password reset links.
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` configure the admin user created on startup when it does not exist.
- `ENABLE_API_DOCS=true` enables Swagger UI in production.
- `SUPABASE_SERVICE_ROLE_KEY` is used only on the backend and must not be exposed to the frontend.

## Development

Start the API with automatic reload:

```cmd
npm run dev
```

Default API URL:

```text
http://localhost:5000/api
```

Health check:

```text
GET /api/health
```

Swagger UI is available in development at:

```text
http://localhost:5000/api-docs
```

## Build and Production

Build TypeScript:

```cmd
npm run build
```

Start the compiled server:

```cmd
npm run start
```

The production entry point is `dist/server.js`.

## Testing and Validation

Run backend tests:

```cmd
npm run test:run
```

Run tests in watch mode:

```cmd
npm run test
```

Run TypeScript validation:

```cmd
npx tsc --noEmit
```

Run linting:

```cmd
npm run lint
```

## Application Structure

```text
backend/
|-- src/
|   |-- app.ts                  # Express app, middleware, routes, Swagger, error handling
|   |-- server.ts               # Environment loading, DNS setup, database connection, server start
|   |-- config/                 # Database and Swagger configuration
|   |-- controllers/            # HTTP request handlers
|   |-- middleware/             # Authentication, authorization, logging, rate limiting
|   |-- models/                 # Mongoose schemas and models
|   |-- routes/                 # Express route definitions
|   |-- services/               # Business logic and external integrations
|   `-- types/                  # Shared backend TypeScript types
|-- tests/                      # Unit and integration tests
|-- package.json
|-- tsconfig.json
`-- vitest.config.ts
```

## API Routes

Base path:

```text
/api
```

Registered route groups:

- `/api/auth` - signup, login, password reset, users, preferences.
- `/api/users` - user endpoints using the same route module as auth.
- `/api/subjects` - subject CRUD.
- `/api/courses` - course CRUD, course content, course progress helpers.
- `/api/modules` - module CRUD.
- `/api/chapters` - chapter CRUD and chapter progress helpers.
- `/api/questions` - question CRUD and question progress helpers.
- `/api/progress` - course, chapter, and question progress updates.
- `/api/feedback` - feedback creation and administration.
- `/api/upload` - image upload to Supabase Storage.
- `/api/user-chapters` - user chapter progress endpoints.
- `/api/user-questions` - user question progress endpoints.
- `/api/health` - service health check.

## Authentication and Authorization

The backend uses JWT authentication and role-based authorization middleware.

Administrative operations require an authenticated user with the admin role. Some frontend proxy routes also forward `x-user-id` for compatibility with admin workflows.

Auth-related traffic and password reset endpoints use rate limiting to reduce abuse.

## Image Upload and Storage Cleanup

Images are uploaded through `/api/upload` and stored in the Supabase Storage `images` bucket. The upload service normalizes images with Sharp before storing them.

Supported upload folders:

- `subjects`
- `courses`
- `chapters`
- `questions`

Cleanup behavior:

- Replacing `subject_img`, `course_img`, or `question_img` deletes the previous Supabase image after the database update succeeds.
- Removing Supabase image links from chapter markdown content deletes only the removed images.
- Deleting a subject deletes its subject image and deletes related courses through the course service.
- Deleting a course deletes its course image, nested chapter images, nested question images, modules, chapters, questions, and progress records.
- Deleting a chapter deletes Supabase images referenced in its markdown content.
- Deleting a question deletes the image stored on the type-specific question document.

Only Supabase public URLs from the `images` bucket are selected for cleanup. External URLs are ignored.

## Main Models

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

Question data is split into a wrapper `Question` document and a type-specific document. The wrapper stores `module_id`, `type`, and `typeId`.

## Response Format

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Error details"
}
```

## Operational Notes

- Restart the backend after changing `.env.local`.
- Do not commit real credentials or service role keys.
- Keep `CORS_ORIGIN` aligned with the frontend URL.
- Keep `FRONTEND_URL` aligned with the public frontend URL so password reset links work correctly.
- Ensure the Supabase `images` bucket exists before using image upload features.
- Run the backend test suite after changes to services, controllers, middleware, progress logic, or storage cleanup.
