## Testing Preferences Flow

### 1. User Registration Flow

**Step 1: Sign up**
```
POST /api/auth
{
  "action": "signup",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_id_here",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Step 2: Auto-redirect to /preferences**
- Frontend saves user data to sessionStorage
- Page displays subjects checkboxes and age group radio buttons

### 2. Save Preferences

**Request:**
```
POST /api/users/{userId}/preferences
Content-Type: application/json

{
  "preferredSubjects": ["subject_id_1", "subject_id_2", "subject_id_3"],
  "ageGroup": "4-9"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences saved successfully",
  "data": {
    "id": "user_id_here",
    "email": "john@example.com",
    "name": "John Doe",
    "ageGroup": "4-9",
    "preferredSubjects": ["subject_id_1", "subject_id_2", "subject_id_3"],
    "hasCompletedOnboarding": true
  }
}
```

### 3. Skip Preferences

**Request:**
```
POST /api/users/{userId}/preferences/skip
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences skipped",
  "data": {
    "id": "user_id_here",
    "email": "john@example.com",
    "name": "John Doe",
    "hasCompletedOnboarding": true
  }
}
```

### 4. Security & Protection

- Page checks for `newUserData` in sessionStorage
- If not found, redirects to /login
- sessionStorage is cleared after preferences are saved or skipped
- Cannot be accessed multiple times by the same user
- hasCompletedOnboarding flag prevents re-access even if they somehow get to the page again

### 5. User Data in Database

After completing preferences, user will have:
```
{
  "_id": "user_id",
  "email": "john@example.com",
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
